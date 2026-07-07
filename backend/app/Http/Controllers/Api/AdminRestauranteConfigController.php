<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestauranteConfig;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
<<<<<<< HEAD
use Illuminate\Http\Request;
=======
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235

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

        $this->normalizeStoredLogo($config);

        return response()->json([
            'data' => $this->serialize($config),
        ]);
    }

    private function normalizeStoredLogo(RestauranteConfig $config): void
    {
<<<<<<< HEAD
        return response()->json([
            'message' => 'La identidad del restaurante (nombre, logo, teléfono y dirección) la gestiona el proveedor del software y no puede modificarse desde el panel de administración.',
        ], 403);
    }

    private function normalizeStoredLogo(RestauranteConfig $config): void
    {
=======
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        $normalized = PublicStorage::normalizeStoredPath($config->logo_url);
        if ($normalized === $config->logo_url) {
            return;
        }

        $config->logo_url = $normalized;
        $config->save();
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(RestauranteConfig $c): array
    {
        $storedPath = PublicStorage::normalizeStoredPath($c->logo_url);
        $logoUrl = PublicStorage::publicUrl($c->logo_url);

        return [
            'idConfig' => $c->idConfig,
            'nombre_comercial' => $c->nombre_comercial,
            'nit_o_documento' => $c->nit_o_documento,
            'nit_editable' => false,
            'editable' => false,
            'telefono' => $c->telefono,
            'direccion' => $c->direccion,
            'logo_url' => $storedPath,
            'logoUrl' => $logoUrl,
            'actualizado_en' => $c->actualizado_en?->toIso8601String(),
        ];
    }
}
