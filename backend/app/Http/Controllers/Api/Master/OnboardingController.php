<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\OnboardingInvitation;
use App\Services\Tenancy\TenantProvisioner;
use App\Support\Tenancy\TenantUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    public function show(string $token): JsonResponse
    {
        config(['database.default' => 'master']);

        $invitation = $this->findUsableInvitation($token);
        if (! $invitation) {
            return response()->json(['message' => 'Enlace inválido o expirado.'], 404);
        }

        $tenant = $invitation->tenant;

        return response()->json([
            'data' => [
                'email' => $invitation->email,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->slug.'.'.TenantUrl::baseDomain(),
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    public function complete(Request $request, string $token, TenantProvisioner $provisioner): JsonResponse
    {
        config(['database.default' => 'master']);

        $invitation = $this->findUsableInvitation($token);
        if (! $invitation) {
            return response()->json(['message' => 'Enlace inválido o expirado.'], 404);
        }

        $tenant = $invitation->tenant;

        if ($tenant->status === 'active') {
            return response()->json(['message' => 'Este restaurante ya fue configurado.'], 422);
        }

        $data = $request->validate([
            'nombre_comercial' => ['required', 'string', 'max:160'],
            'nit_o_documento' => ['nullable', 'string', 'max:40'],
            'telefono' => ['nullable', 'string', 'max:40'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'admin_nombre' => ['required', 'string', 'max:120'],
            'admin_apellido' => ['required', 'string', 'max:120'],
            'admin_correo' => ['required', 'email', 'max:190'],
            'admin_password' => ['required', 'string', 'min:8', 'max:120'],
            'admin_cedula' => ['nullable', 'string', 'max:32'],
            'admin_telefono' => ['nullable', 'string', 'max:40'],
            'logo' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        try {
            DB::connection('master')->transaction(function () use ($invitation): void {
                $invitation->update(['used_at' => now()]);
            });

            $logoUrl = null;
            if ($request->hasFile('logo')) {
                $logoUrl = TenantProvisioner::storeLogoForTenant($tenant, $request->file('logo'));
            }

            $payload = array_merge($data, [
                'logo_url' => $logoUrl,
                'admin_correo' => strtolower(trim($data['admin_correo'])),
            ]);

            $provisioner->provision($tenant, $payload);

            $tenant->refresh();

            return response()->json([
                'message' => 'Restaurante configurado correctamente.',
                'data' => [
                    'nombre_comercial' => $tenant->nombre_comercial,
                    'tenant_url' => $tenant->tenantAppUrl(),
                    'admin_login' => $tenant->tenantAppUrl().'/login-admin',
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'No se pudo completar la configuración: '.$e->getMessage(),
            ], 500);
        }
    }

    private function findUsableInvitation(string $plain): ?OnboardingInvitation
    {
        return OnboardingInvitation::query()
            ->with('tenant')
            ->where('token_hash', hash('sha256', $plain))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();
    }
}
