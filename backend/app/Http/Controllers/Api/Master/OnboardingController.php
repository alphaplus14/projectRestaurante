<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\OnboardingInvitation;
use App\Models\Master\Tenant;
use App\Services\Tenancy\TenantProvisioner;
use App\Support\Tenancy\TenantUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function show(string $token): JsonResponse
    {
        config(['database.default' => 'master']);

        $plain = $this->normalizeToken($token);
        $resolved = $this->resolveInvitation($plain);

        if ($resolved['http_status'] !== 200) {
            return response()->json([
                'message' => $resolved['message'],
                'reason' => $resolved['reason'],
                'data' => $resolved['data'] ?? null,
            ], $resolved['http_status']);
        }

        return response()->json([
            'message' => $resolved['message'],
            'reason' => $resolved['reason'],
            'data' => $resolved['data'],
        ]);
    }

    public function complete(Request $request, string $token, TenantProvisioner $provisioner): JsonResponse
    {
        config(['database.default' => 'master']);

        $plain = $this->normalizeToken($token);
        $resolved = $this->resolveInvitation($plain);

        if ($resolved['reason'] === 'already_active') {
            return response()->json([
                'message' => $resolved['message'],
                'data' => $resolved['data'],
            ]);
        }

        if ($resolved['http_status'] !== 200 || empty($resolved['invitation'])) {
            return response()->json([
                'message' => $resolved['message'],
                'reason' => $resolved['reason'],
            ], $resolved['http_status']);
        }

        $invitation = $resolved['invitation'];
        $tenant = $invitation->tenant;

        if ($tenant->status === 'provisioning') {
            return response()->json([
                'message' => 'La configuración ya está en curso. Espera unos segundos y recarga la página.',
                'reason' => 'provisioning',
            ], 409);
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
            $logoUrl = null;
            if ($request->hasFile('logo')) {
                $logoUrl = TenantProvisioner::storeLogoForTenant($tenant, $request->file('logo'));
            }

            $payload = array_merge($data, [
                'logo_url' => $logoUrl,
                'admin_correo' => strtolower(trim($data['admin_correo'])),
            ]);

            $provisioner->provision($tenant, $payload);

            $invitation->update(['used_at' => now()]);
            $tenant->refresh();

            $appUrl = $tenant->tenantAppUrl();

            return response()->json([
                'message' => 'Restaurante configurado correctamente.',
                'data' => [
                    'slug' => $tenant->slug,
                    'nombre_comercial' => $tenant->nombre_comercial,
                    'tenant_url' => $appUrl,
                    'admin_login' => $appUrl.'/login-admin',
                    'cliente_url' => $appUrl.'/cliente',
                    'staff_url' => $appUrl.'/staff',
                    'admin_correo' => $payload['admin_correo'],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'No se pudo completar la configuración: '.$e->getMessage(),
            ], 500);
        }
    }

    private function normalizeToken(string $token): string
    {
        return trim(urldecode($token));
    }

    /**
     * @return array{
     *   http_status: int,
     *   reason: string,
     *   message: string,
     *   data?: array<string, mixed>,
     *   invitation?: OnboardingInvitation|null
     * }
     */
    private function resolveInvitation(string $plain): array
    {
        if ($plain === '') {
            return [
                'http_status' => 404,
                'reason' => 'invalid',
                'message' => 'Enlace incompleto. Usa el enlace completo del correo.',
            ];
        }

        $invitation = OnboardingInvitation::query()
            ->with('tenant')
            ->where('token_hash', hash('sha256', $plain))
            ->first();

        if (! $invitation) {
            return [
                'http_status' => 404,
                'reason' => 'invalid',
                'message' => 'Enlace no reconocido. Pide al administrador que reenvíe la invitación.',
            ];
        }

        /** @var Tenant $tenant */
        $tenant = $invitation->tenant;

        if ($tenant->status === 'active') {
            $appUrl = $tenant->tenantAppUrl();

            return [
                'http_status' => 200,
                'reason' => 'already_active',
                'message' => 'Este restaurante ya está configurado.',
                'data' => [
                    'email' => $invitation->email,
                    'slug' => $tenant->slug,
                    'nombre_comercial' => $tenant->nombre_comercial,
                    'subdomain' => $tenant->slug.'.'.TenantUrl::baseDomain(),
                    'tenant_url' => $appUrl,
                    'admin_login' => $appUrl.'/login-admin',
                    'cliente_url' => $appUrl.'/cliente',
                    'staff_url' => $appUrl.'/staff',
                ],
            ];
        }

        if ($tenant->status === 'provisioning') {
            return [
                'http_status' => 200,
                'reason' => 'provisioning',
                'message' => 'Estamos creando la base de datos de tu restaurante…',
                'data' => [
                    'email' => $invitation->email,
                    'slug' => $tenant->slug,
                    'subdomain' => $tenant->slug.'.'.TenantUrl::baseDomain(),
                ],
            ];
        }

        if ($invitation->used_at !== null) {
            return [
                'http_status' => 410,
                'reason' => 'used',
                'message' => 'Este enlace ya se utilizó. Solicita un correo nuevo desde Master.',
                'data' => [
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                ],
            ];
        }

        if ($invitation->expires_at->isPast()) {
            return [
                'http_status' => 410,
                'reason' => 'expired',
                'message' => 'El enlace expiró. Solicita que reenvíen la invitación.',
                'data' => [
                    'expires_at' => $invitation->expires_at->toIso8601String(),
                ],
            ];
        }

        $reason = $tenant->status === 'failed' ? 'failed' : 'ready';
        $message = $tenant->status === 'failed'
            ? 'La configuración anterior falló. Puedes intentarlo de nuevo.'
            : 'OK';

        return [
            'http_status' => 200,
            'reason' => $reason,
            'message' => $message,
            'data' => [
                'email' => $invitation->email,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->slug.'.'.TenantUrl::baseDomain(),
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'provision_error' => $tenant->provision_error,
            ],
            'invitation' => $invitation,
        ];
    }
}
