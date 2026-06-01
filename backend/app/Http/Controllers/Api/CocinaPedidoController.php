<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CocinaLlamadaMesero;
use App\Models\Pedido;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CocinaPedidoController extends Controller
{
    /**
     * Pedidos visibles en cocina: los que el salón ya registró y aún no se cerraron.
     */
    public function index(): JsonResponse
    {
        $pedidos = Pedido::query()
            ->with([
                'mesa:idMesa,numero,nombre',
                'mesero:idUsuario,nombre,apellido',
                'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with([
                    'producto:idProducto,nombreProducto,tipo,descripcion,imagen',
                ]),
            ])
            ->whereIn('estado', ['PENDIENTE', 'EN_PREPARACION', 'LISTO'])
            ->orderByRaw("FIELD(estado, 'PENDIENTE', 'EN_PREPARACION', 'LISTO')")
            ->orderBy('creado_en')
            ->get();

        return response()->json([
            'data' => $pedidos->map(fn (Pedido $p) => $this->serializePedido($p)),
        ]);
    }

    /**
     * Historial y filtros para el panel de ajustes en cocina.
     */
    public function historial(Request $request): JsonResponse
    {
        $filtro = $request->query('filtro', 'todas');

        $query = Pedido::query()
            ->with([
                'mesa:idMesa,numero,nombre',
                'mesero:idUsuario,nombre,apellido',
                'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with([
                    'producto:idProducto,nombreProducto,tipo,descripcion,imagen',
                ]),
            ]);

        match ($filtro) {
            'activos' => $query->whereIn('estado', ['PENDIENTE', 'EN_PREPARACION', 'LISTO']),
            'cancelados' => $query->where('estado', 'CANCELADO'),
            'cerrados' => $query->where('estado', 'CERRADO'),
            'entregados' => $query->where('estado', 'ENTREGADO'),
            'listos' => $query->where('estado', 'LISTO'),
            default => null,
        };

        $items = $query->orderByDesc('creado_en')->limit(150)->get();

        $conteos = [
            'todas' => (int) Pedido::query()->count(),
            'activos' => (int) Pedido::query()->whereIn('estado', ['PENDIENTE', 'EN_PREPARACION', 'LISTO'])->count(),
            'cancelados' => (int) Pedido::query()->where('estado', 'CANCELADO')->count(),
            'cerrados' => (int) Pedido::query()->where('estado', 'CERRADO')->count(),
            'entregados' => (int) Pedido::query()->where('estado', 'ENTREGADO')->count(),
            'listos' => (int) Pedido::query()->where('estado', 'LISTO')->count(),
        ];

        return response()->json([
            'data' => $items->map(fn (Pedido $p) => $this->serializePedido($p)),
            'conteos' => $conteos,
            'filtro' => $filtro,
        ]);
    }

    public function llamarMesero(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Usuario) {
            abort(401, 'No autenticado.');
        }

        $pendiente = CocinaLlamadaMesero::query()
            ->whereNull('atendida_en')
            ->where('creado_en', '>=', now()->subMinutes(10))
            ->exists();

        if ($pendiente) {
            return response()->json([
                'message' => 'Ya hay una llamada activa al mesero. Espera a que atiendan.',
            ], 422);
        }

        $llamada = CocinaLlamadaMesero::create([
            'cocinero_idUsuario' => (int) $user->getAuthIdentifier(),
            'creado_en' => now(),
            'atendida_en' => null,
            'mesero_idUsuario' => null,
        ]);

        $llamada->load('cocinero:idUsuario,nombre,apellido');

        return response()->json([
            'message' => 'Llamada enviada al mesero.',
            'data' => $this->serializeLlamada($llamada),
        ], 201);
    }

    public function updateEstado(Request $request, Pedido $pedido): JsonResponse
    {
        $data = $request->validate([
            'estado' => ['required', 'string', Rule::in(['EN_PREPARACION', 'LISTO'])],
        ]);

        if (in_array($pedido->estado, ['CERRADO', 'CANCELADO'], true)) {
            throw ValidationException::withMessages([
                'estado' => ['Este pedido ya no puede modificarse en cocina.'],
            ]);
        }

        $next = $data['estado'];

        if ($pedido->estado === 'PENDIENTE' && $next !== 'EN_PREPARACION') {
            throw ValidationException::withMessages([
                'estado' => ['Un pedido nuevo debe pasar primero a EN_PREPARACION.'],
            ]);
        }

        if ($pedido->estado === 'EN_PREPARACION' && $next !== 'LISTO') {
            throw ValidationException::withMessages([
                'estado' => ['En preparación solo puede pasar a LISTO.'],
            ]);
        }

        if ($pedido->estado === 'LISTO') {
            throw ValidationException::withMessages([
                'estado' => ['El pedido ya está listo para que el mesero lo retire.'],
            ]);
        }

        DB::transaction(function () use ($pedido, $next): void {
            $pedido->estado = $next;
            $pedido->save();

            if ($next === 'EN_PREPARACION') {
                $pedido->detalles()->where('estado_item', 'PENDIENTE')->update(['estado_item' => 'EN_PREPARACION']);
            }
            if ($next === 'LISTO') {
                $pedido->detalles()->whereIn('estado_item', ['PENDIENTE', 'EN_PREPARACION'])->update(['estado_item' => 'LISTO']);
            }
        });

        $pedido->load([
            'mesa:idMesa,numero,nombre',
            'mesero:idUsuario,nombre,apellido',
            'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with([
                'producto:idProducto,nombreProducto,tipo,descripcion,imagen',
            ]),
        ]);

        return response()->json([
            'data' => $this->serializePedido($pedido),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePedido(Pedido $p): array
    {
        return [
            'idPedido' => $p->idPedido,
            'estado' => $p->estado,
            'notas' => $p->notas,
            'motivo_cancelacion' => $p->motivo_cancelacion,
            'cancelado_en' => $p->cancelado_en?->toIso8601String(),
            'cerrado_en' => $p->cerrado_en?->toIso8601String(),
            'creado_en' => $p->creado_en?->toIso8601String(),
            'actualizado_en' => $p->actualizado_en?->toIso8601String(),
            'mesa' => $p->mesa ? [
                'idMesa' => $p->mesa->idMesa,
                'numero' => $p->mesa->numero,
                'nombre' => $p->mesa->nombre,
            ] : null,
            'mesero' => $p->mesero ? [
                'idUsuario' => $p->mesero->idUsuario,
                'nombre' => trim(($p->mesero->nombre ?? '').' '.($p->mesero->apellido ?? '')) ?: null,
            ] : null,
            'detalles' => $p->detalles->map(fn ($d) => [
                'idPedidoDetalle' => $d->idPedidoDetalle,
                'cantidad' => $d->cantidad,
                'precio_unitario' => $d->precio_unitario,
                'nota' => $d->nota,
                'estado_item' => $d->estado_item,
                'producto' => $d->producto ? [
                    'nombreProducto' => $d->producto->nombreProducto,
                    'tipo' => $d->producto->tipo,
                    'descripcion' => $d->producto->descripcion,
                    'imagenUrl' => $d->producto->imagen
                        ? asset('storage/'.$d->producto->imagen)
                        : null,
                ] : null,
            ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLlamada(CocinaLlamadaMesero $l): array
    {
        $cocinero = $l->cocinero;
        $nombreCocinero = $cocinero
            ? trim(($cocinero->nombre ?? '').' '.($cocinero->apellido ?? ''))
            : 'Cocina';

        return [
            'id' => $l->id,
            'creado_en' => $l->creado_en?->toIso8601String(),
            'atendida_en' => $l->atendida_en?->toIso8601String(),
            'cocinero_nombre' => $nombreCocinero ?: 'Cocina',
        ];
    }
}
