<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestauranteConfig;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminRestauranteConfigController extends Controller
{
    public function show(): JsonResponse
    {
        $config = RestauranteConfig::query()->orderBy('idConfig')->first();

        if (! $config) {
            return response()->json([
                'message' => 'No existe registro de configuración del restaurante.',
            ], 404);
        }

        return response()->json([
            'data' => $this->serialize($config),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $config = RestauranteConfig::query()->orderBy('idConfig')->firstOrFail();

        $user = $request->user();
        if (! $user instanceof Usuario) {
            abort(401, 'No autenticado.');
        }

        $nombreAnterior = (string) $config->nombre_comercial;

        $data = $request->validate([
            'nombre_comercial' => ['required', 'string', 'max:160'],
            'telefono' => ['nullable', 'string', 'max:40'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'password_actual' => [
                Rule::requiredIf(function () use ($request, $nombreAnterior) {
                    $nuevo = trim((string) $request->input('nombre_comercial', ''));

                    return $nuevo !== $nombreAnterior;
                }),
                'nullable',
                'string',
            ],
            'logo' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
        ]);

        $nombreNuevo = trim((string) $data['nombre_comercial']);

        if ($nombreNuevo !== $nombreAnterior) {
            $plain = (string) ($data['password_actual'] ?? '');
            $hash = DB::table('usuario')
                ->where('idUsuario', $user->idUsuario)
                ->value('password');

            if ($plain === '' || ! is_string($hash) || ! Hash::check($plain, $hash)) {
                return response()->json([
                    'message' => 'Contraseña incorrecta. No se cambió el nombre comercial.',
                ], 422);
            }
        }

        $tel = isset($data['telefono']) ? trim((string) $data['telefono']) : null;
        $dir = isset($data['direccion']) ? trim((string) $data['direccion']) : null;

        $config->nombre_comercial = $nombreNuevo;
        // NIT/documento: solo lectura vía panel; identifica la licencia del local.
        $config->telefono = $tel !== '' ? $tel : null;
        $config->direccion = $dir !== '' ? $dir : null;

        if ($request->hasFile('logo')) {
            $this->deleteStoredLogo($config->logo_url);
            $path = $request->file('logo')->store('restaurante', 'public');
            $config->logo_url = $path;
        }

        $config->actualizado_en = now();
        $config->save();

        return response()->json([
            'message' => 'Configuración guardada.',
            'data' => $this->serialize($config->refresh()),
        ]);
    }

    private function deleteStoredLogo(?string $path): void
    {
        if (! $path || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(RestauranteConfig $c): array
    {
        $logoUrl = null;
        if ($c->logo_url) {
            $logoUrl = str_starts_with($c->logo_url, 'http://') || str_starts_with($c->logo_url, 'https://')
                ? $c->logo_url
                : asset('storage/'.$c->logo_url);
        }

        return [
            'idConfig' => $c->idConfig,
            'nombre_comercial' => $c->nombre_comercial,
            'nit_o_documento' => $c->nit_o_documento,
            'nit_editable' => false,
            'telefono' => $c->telefono,
            'direccion' => $c->direccion,
            'logo_url' => $c->logo_url,
            'logoUrl' => $logoUrl,
            'actualizado_en' => $c->actualizado_en?->toIso8601String(),
        ];
    }
}
