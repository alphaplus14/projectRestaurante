<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\PlatformBillingSetting;
use App\Models\Master\SubscriptionRenewalRequest;
use App\Models\Master\Tenant;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MasterBillingController extends Controller
{
    public function settings(): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeBillingSettings(PlatformBillingSetting::current()),
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nequi_key' => ['nullable', 'string', 'max:40'],
            'payment_instructions' => ['nullable', 'string', 'max:2000'],
            'price_1_month_cop' => ['nullable', 'integer', 'min:1', 'max:999999999'],
            'price_3_months_cop' => ['nullable', 'integer', 'min:1', 'max:999999999'],
            'price_6_months_cop' => ['nullable', 'integer', 'min:1', 'max:999999999'],
            'price_12_months_cop' => ['nullable', 'integer', 'min:1', 'max:999999999'],
            'nequi_qr' => ['nullable', 'file', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
        ]);

        $settings = PlatformBillingSetting::current();

        if (array_key_exists('nequi_key', $data)) {
            $settings->nequi_key = $data['nequi_key'] !== '' ? $data['nequi_key'] : null;
        }

        if (array_key_exists('payment_instructions', $data)) {
            $settings->payment_instructions = $data['payment_instructions'] !== ''
                ? $data['payment_instructions']
                : null;
        }

        $settings->syncPackagePrices([
            1 => $data['price_1_month_cop'] ?? null,
            3 => $data['price_3_months_cop'] ?? null,
            6 => $data['price_6_months_cop'] ?? null,
            12 => $data['price_12_months_cop'] ?? null,
        ]);

        if ($request->hasFile('nequi_qr')) {
            PublicStorage::deleteIfStored($settings->nequi_qr_path);
            $settings->nequi_qr_path = PublicStorage::storePlatformNequiQr($request->file('nequi_qr'));
        }

        $settings->save();

        return response()->json([
            'message' => 'Datos de pago Nequi actualizados.',
            'data' => $this->serializeBillingSettings($settings->fresh()),
        ]);
    }

    public function renewalRequests(): JsonResponse
    {
        $requests = SubscriptionRenewalRequest::query()
            ->with('tenant:id,slug,nombre_comercial,contact_email,status,access_expires_at')
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (SubscriptionRenewalRequest $row) => $this->serializeRenewalRequest($row));

        return response()->json([
            'data' => $requests,
        ]);
    }

    public function approveRenewal(Request $request, SubscriptionRenewalRequest $renewalRequest): JsonResponse
    {
        if (! $renewalRequest->isPending()) {
            throw ValidationException::withMessages([
                'renewal' => ['Esta solicitud ya fue revisada.'],
            ]);
        }

        $tenant = $renewalRequest->tenant;
        if (! $tenant instanceof Tenant) {
            throw ValidationException::withMessages([
                'renewal' => ['No se encontró el restaurante asociado.'],
            ]);
        }

        if (! in_array($tenant->status, ['active', 'suspended'], true)) {
            throw ValidationException::withMessages([
                'tenant' => ['Solo puedes aprobar pagos de restaurantes activos o suspendidos.'],
            ]);
        }

        if ($tenant->onboarding_completed_at === null) {
            throw ValidationException::withMessages([
                'tenant' => ['Este restaurante aún no completó el onboarding.'],
            ]);
        }

        $data = $request->validate([
            'master_note' => ['nullable', 'string', 'max:500'],
        ]);

        $tenant->extendAccessByMonths((int) $renewalRequest->months);

        $renewalRequest->update([
            'status' => SubscriptionRenewalRequest::STATUS_APPROVED,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'master_note' => $data['master_note'] ?? null,
        ]);

        $renewalRequest->load('tenant:id,slug,nombre_comercial,contact_email,status,access_expires_at');

        return response()->json([
            'message' => "Pago confirmado. Acceso extendido {$renewalRequest->months} mes(es).",
            'data' => $this->serializeRenewalRequest($renewalRequest),
        ]);
    }

    public function rejectRenewal(Request $request, SubscriptionRenewalRequest $renewalRequest): JsonResponse
    {
        if (! $renewalRequest->isPending()) {
            throw ValidationException::withMessages([
                'renewal' => ['Esta solicitud ya fue revisada.'],
            ]);
        }

        $data = $request->validate([
            'master_note' => ['nullable', 'string', 'max:500'],
        ]);

        $renewalRequest->update([
            'status' => SubscriptionRenewalRequest::STATUS_REJECTED,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'master_note' => $data['master_note'] ?? null,
        ]);

        $renewalRequest->load('tenant:id,slug,nombre_comercial,contact_email,status,access_expires_at');

        return response()->json([
            'message' => 'Solicitud de renovación rechazada.',
            'data' => $this->serializeRenewalRequest($renewalRequest),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeBillingSettings(PlatformBillingSetting $settings): array
    {
        $packages = $settings->packagePrices();

        return [
            'nequi_key' => $settings->nequi_key,
            'nequi_qr_path' => PublicStorage::normalizeStoredPath($settings->nequi_qr_path),
            'nequi_qr_url' => PublicStorage::publicUrl($settings->nequi_qr_path),
            'payment_instructions' => $settings->payment_instructions,
            'package_prices' => [
                '1' => $packages[1],
                '3' => $packages[3],
                '6' => $packages[6],
                '12' => $packages[12],
            ],
            'month_options' => PlatformBillingSetting::PACKAGE_MONTHS,
            'configured' => $settings->nequi_key !== null
                || $settings->nequi_qr_path !== null
                || collect($packages)->contains(fn (int $price) => $price > 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRenewalRequest(SubscriptionRenewalRequest $row): array
    {
        $tenant = $row->tenant;

        return [
            'id' => $row->id,
            'tenant_id' => $row->tenant_id,
            'tenant_slug' => $tenant?->slug,
            'tenant_name' => $tenant?->nombre_comercial ?: $tenant?->slug,
            'tenant_email' => $tenant?->contact_email,
            'tenant_status' => $tenant?->status,
            'tenant_access_expires_at' => $tenant?->access_expires_at?->toIso8601String(),
            'months' => $row->months,
            'amount_cop' => $row->amount_cop,
            'payment_reference' => $row->payment_reference,
            'status' => $row->status,
            'admin_note' => $row->admin_note,
            'master_note' => $row->master_note,
            'reviewed_at' => $row->reviewed_at?->toIso8601String(),
            'created_at' => $row->created_at?->toIso8601String(),
        ];
    }
}
