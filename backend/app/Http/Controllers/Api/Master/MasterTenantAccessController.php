<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MasterTenantAccessController extends Controller
{
    public function suspend(Tenant $tenant): JsonResponse
    {
        if ($tenant->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant' => ['Solo puedes desactivar restaurantes que estén activos.'],
            ]);
        }

        $tenant->update(['status' => 'suspended']);

        return response()->json([
            'message' => 'Acceso desactivado. El cliente ya no puede entrar a su subdominio.',
            'data' => $this->serializeTenant($tenant->fresh()),
        ]);
    }

    public function extendAccess(Request $request, Tenant $tenant): JsonResponse
    {
        if (! in_array($tenant->status, ['active', 'suspended'], true)) {
            throw ValidationException::withMessages([
                'tenant' => ['Solo puedes asignar meses a restaurantes activos o suspendidos.'],
            ]);
        }

        if ($tenant->onboarding_completed_at === null) {
            throw ValidationException::withMessages([
                'tenant' => ['Este restaurante aún no completó el onboarding.'],
            ]);
        }

        $data = $request->validate([
            'months' => ['required', 'integer', 'min:1', 'max:36'],
        ]);

        $tenant->extendAccessByMonths((int) $data['months']);

        return response()->json([
            'message' => "Acceso extendido {$data['months']} mes(es).",
            'data' => $this->serializeTenant($tenant->fresh()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTenant(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'slug' => $tenant->slug,
            'status' => $tenant->status,
            'access_expires_at' => $tenant->access_expires_at?->toIso8601String(),
            'access_active' => $tenant->isAccessActive(),
            'access_days_remaining' => $tenant->accessDaysRemaining(),
        ];
    }
}
