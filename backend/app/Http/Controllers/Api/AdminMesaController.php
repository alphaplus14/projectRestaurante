<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesa;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminMesaController extends Controller
{
    private const ABIERTOS = ['PENDIENTE', 'EN_PREPARACION', 'LISTO'];

    public function index(): JsonResponse
    {
        $mesas = Mesa::query()
            ->orderBy('numero')
            ->get();

        return response()->json([
            'data' => $mesas->map(fn (Mesa $m) => $this->serializeMesa($m)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $nom = $request->input('nombre');
        $request->merge([
            'nombre' => is_string($nom) && trim($nom) !== '' ? trim($nom) : null,
        ]);

        $data = $request->validate([
            'numero' => ['required', 'integer', 'min:1', 'max:9999', Rule::unique('mesa', 'numero')],
            'nombre' => ['nullable', 'string', 'max:80', Rule::unique('mesa', 'nombre')],
            'capacidad' => ['required', 'integer', 'min:1', 'max:99'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        $mesa = Mesa::create([
            'numero' => $data['numero'],
            'nombre' => $data['nombre'] ?? null,
            'capacidad' => $data['capacidad'],
            'estado' => 'LIBRE',
            'activa' => array_key_exists('activa', $data) ? (bool) $data['activa'] : true,
        ]);

        return response()->json([
            'message' => 'Mesa creada.',
            'data' => $this->serializeMesa($mesa),
        ], 201);
    }

    public function update(Request $request, Mesa $mesa): JsonResponse
    {
        $nom = $request->input('nombre');
        $request->merge([
            'nombre' => is_string($nom) && trim($nom) !== '' ? trim($nom) : null,
        ]);

        $data = $request->validate([
            'numero' => ['required', 'integer', 'min:1', 'max:9999', Rule::unique('mesa', 'numero')->ignore($mesa->idMesa, 'idMesa')],
            'nombre' => ['nullable', 'string', 'max:80', Rule::unique('mesa', 'nombre')->ignore($mesa->idMesa, 'idMesa')],
            'capacidad' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $mesa->numero = $data['numero'];
        $mesa->nombre = $data['nombre'] ?? null;
        $mesa->capacidad = $data['capacidad'];
        $mesa->save();

        return response()->json([
            'message' => 'Mesa actualizada.',
            'data' => $this->serializeMesa($mesa->refresh()),
        ]);
    }

    public function setActivo(Request $request, Mesa $mesa): JsonResponse
    {
        $data = $request->validate([
            'activa' => ['required', 'boolean'],
        ]);

        if (! $data['activa']) {
            $pedidoAbierto = Pedido::query()
                ->where('mesa_idMesa', $mesa->idMesa)
                ->whereIn('estado', self::ABIERTOS)
                ->exists();

            if ($pedidoAbierto) {
                return response()->json([
                    'message' => 'No puedes desactivar la mesa mientras tenga un pedido abierto.',
                ], 422);
            }
        }

        $mesa->activa = (bool) $data['activa'];
        $mesa->save();

        return response()->json([
            'message' => $mesa->activa ? 'Mesa activada.' : 'Mesa desactivada.',
            'data' => $this->serializeMesa($mesa),
        ]);
    }

    public function destroy(Mesa $mesa): JsonResponse
    {
        $tienePedidos = Pedido::query()->where('mesa_idMesa', $mesa->idMesa)->exists();

        if ($tienePedidos) {
            return response()->json([
                'message' => 'No se puede eliminar: la mesa tiene historial de pedidos. Desactívala en su lugar.',
            ], 422);
        }

        $mesa->delete();

        return response()->json([
            'message' => 'Mesa eliminada.',
        ]);
    }

    /**
     * Historial de pedidos de la mesa (más recientes primero).
     */
    public function historialPedidos(Mesa $mesa): JsonResponse
    {
        $pedidos = Pedido::query()
            ->where('mesa_idMesa', $mesa->idMesa)
            ->with(['mesero:idUsuario,nombre,apellido'])
            ->orderByDesc('creado_en')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $pedidos->map(function (Pedido $p) {
                return [
                    'idPedido' => $p->idPedido,
                    'estado' => $p->estado,
                    'creado_en' => $p->creado_en?->toIso8601String(),
                    'cerrado_en' => $p->cerrado_en?->toIso8601String(),
                    'notas' => $p->notas,
                    'mesero' => $p->mesero
                        ? trim(($p->mesero->nombre ?? '').' '.($p->mesero->apellido ?? ''))
                        : null,
                ];
            }),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMesa(Mesa $mesa): array
    {
        return [
            'idMesa' => $mesa->idMesa,
            'numero' => $mesa->numero,
            'nombre' => $mesa->nombre,
            'capacidad' => $mesa->capacidad,
            'estado' => $mesa->estado,
            'activa' => (bool) $mesa->activa,
        ];
    }
}
