<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\Producto;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeseroController extends Controller
{
    private const ABIERTOS = ['PENDIENTE', 'EN_PREPARACION', 'LISTO'];

    /**
     * Mesas activas con resumen del pedido abierto (si existe).
     */
    public function mesas(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Usuario) {
            abort(401, 'No autenticado.');
        }

        $authId = (int) $user->getAuthIdentifier();

        $mesas = Mesa::query()
            ->where('activa', true)
            ->orderBy('numero')
            ->get();

        $pedidos = Pedido::query()
            ->whereIn('estado', self::ABIERTOS)
            ->get()
            ->keyBy('mesa_idMesa');

        return response()->json([
            'data' => $mesas->map(function (Mesa $mesa) use ($pedidos, $authId) {
                /** @var Pedido|null $p */
                $p = $pedidos->get($mesa->idMesa);

                $pedidoActivo = null;
                if ($p) {
                    if ((int) $p->mesero_idUsuario === $authId) {
                        $pedidoActivo = [
                            'idPedido' => $p->idPedido,
                            'estado' => $p->estado,
                            'creado_en' => $p->creado_en?->toIso8601String(),
                        ];
                    } else {
                        $pedidoActivo = [
                            'bloqueado' => true,
                            'estado' => $p->estado,
                            'mensaje' => 'Pedido abierto por otro mesero.',
                        ];
                    }
                }

                return [
                    'idMesa' => $mesa->idMesa,
                    'numero' => $mesa->numero,
                    'nombre' => $mesa->nombre,
                    'capacidad' => $mesa->capacidad,
                    'estado' => $mesa->estado,
                    'pedido_activo' => $pedidoActivo,
                ];
            }),
        ]);
    }

    public function showPedido(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorizeMesero($request, $pedido);

        $pedido->load([
            'mesa:idMesa,numero,nombre',
            'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with('producto:idProducto,nombreProducto,tipo'),
        ]);

        return response()->json([
            'data' => $this->serializePedidoCompleto($pedido),
        ]);
    }

    /**
     * Abrir cuenta: nuevo pedido en la mesa (solo si no hay otro abierto).
     */
    public function storePedido(Request $request): JsonResponse
    {
        $mesero = $request->user();
        if (! $mesero instanceof Usuario) {
            abort(401, 'No autenticado.');
        }

        $data = $request->validate([
            'mesa_idMesa' => ['required', 'integer', 'exists:mesa,idMesa'],
            'notas' => ['nullable', 'string', 'max:500'],
            'reserva_idReserva' => ['nullable', 'integer', 'exists:reserva,idReserva'],
        ]);

        $mesa = Mesa::query()->where('idMesa', $data['mesa_idMesa'])->where('activa', true)->first();
        if (! $mesa) {
            abort(404, 'Mesa no disponible.');
        }

        $existe = Pedido::query()
            ->where('mesa_idMesa', $mesa->idMesa)
            ->whereIn('estado', self::ABIERTOS)
            ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Esta mesa ya tiene un pedido abierto. Ciérralo o úsalo desde el panel.',
            ], 409);
        }

        $pedido = DB::transaction(function () use ($data, $mesero, $mesa): Pedido {
            $mesa->estado = 'OCUPADA';
            $mesa->save();

            return Pedido::create([
                'mesa_idMesa' => $mesa->idMesa,
                'mesero_idUsuario' => (int) $mesero->getAuthIdentifier(),
                'reserva_idReserva' => $data['reserva_idReserva'] ?? null,
                'estado' => 'PENDIENTE',
                'notas' => $data['notas'] ?? null,
                'creado_en' => now(),
                'actualizado_en' => now(),
                'cerrado_en' => null,
            ]);
        });

        $pedido->load([
            'mesa:idMesa,numero,nombre',
            'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with('producto:idProducto,nombreProducto,tipo'),
        ]);

        return response()->json([
            'data' => $this->serializePedidoCompleto($pedido),
        ], 201);
    }

    /**
     * Agregar línea al pedido (producto activo, precio snapshot).
     */
    public function storeDetalle(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorizeMesero($request, $pedido);

        if (in_array($pedido->estado, ['CERRADO', 'CANCELADO', 'LISTO'], true)) {
            return response()->json([
                'message' => 'No se pueden agregar ítems: el pedido está listo o cerrado.',
            ], 422);
        }

        $data = $request->validate([
            'producto_idProducto' => ['required', 'integer', 'exists:producto,idProducto'],
            'cantidad' => ['required', 'integer', 'min:1', 'max:99'],
            'nota' => ['nullable', 'string', 'max:255'],
        ]);

        $producto = Producto::query()
            ->where('idProducto', $data['producto_idProducto'])
            ->where('activo', true)
            ->whereHas('categoria', fn ($q) => $q->where('activa', true))
            ->first();

        if (! $producto) {
            return response()->json(['message' => 'Producto no disponible.'], 422);
        }

        $detalle = PedidoDetalle::create([
            'pedido_idPedido' => $pedido->idPedido,
            'producto_idProducto' => $producto->idProducto,
            'cantidad' => $data['cantidad'],
            'precio_unitario' => $producto->precio,
            'nota' => $data['nota'] ?? null,
            'estado_item' => 'PENDIENTE',
            'creado_en' => now(),
        ]);

        $pedido->touch();

        $detalle->load('producto:idProducto,nombreProducto,tipo');

        return response()->json([
            'data' => [
                'detalle' => [
                    'idPedidoDetalle' => $detalle->idPedidoDetalle,
                    'cantidad' => $detalle->cantidad,
                    'precio_unitario' => $detalle->precio_unitario,
                    'nota' => $detalle->nota,
                    'estado_item' => $detalle->estado_item,
                    'producto' => $detalle->producto ? [
                        'nombreProducto' => $detalle->producto->nombreProducto,
                        'tipo' => $detalle->producto->tipo,
                    ] : null,
                ],
                'pedido' => $this->serializePedidoCompleto($pedido->refresh()->load([
                    'mesa:idMesa,numero,nombre',
                    'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with('producto:idProducto,nombreProducto,tipo'),
                ])),
            ],
        ], 201);
    }

    /**
     * Cerrar cuenta: pedido CERRADO y mesa LIBRE (tras retiro en cocina).
     */
    public function cerrarPedido(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorizeMesero($request, $pedido);

        if (in_array($pedido->estado, ['CERRADO', 'CANCELADO'], true)) {
            return response()->json([
                'message' => 'Este pedido ya está cerrado o cancelado.',
            ], 422);
        }

        if ($pedido->estado !== 'LISTO') {
            return response()->json([
                'message' => 'Solo puedes cerrar cuenta cuando cocina marque el pedido como listo.',
            ], 422);
        }

        if (! $pedido->detalles()->exists()) {
            return response()->json([
                'message' => 'El pedido no tiene ítems.',
            ], 422);
        }

        DB::transaction(function () use ($pedido): void {
            $pedido->estado = 'CERRADO';
            $pedido->cerrado_en = now();
            $pedido->save();

            $mesa = Mesa::query()->where('idMesa', $pedido->mesa_idMesa)->first();
            if ($mesa) {
                $mesa->estado = 'LIBRE';
                $mesa->save();
            }
        });

        $pedido->refresh()->load([
            'mesa:idMesa,numero,nombre',
            'detalles' => fn ($q) => $q->orderBy('idPedidoDetalle')->with('producto:idProducto,nombreProducto,tipo'),
        ]);

        return response()->json([
            'data' => $this->serializePedidoCompleto($pedido),
            'message' => 'Cuenta cerrada. La mesa quedó libre.',
        ]);
    }

    private function authorizeMesero(Request $request, Pedido $pedido): void
    {
        $user = $request->user();
        if (! $user instanceof Usuario) {
            abort(401, 'No autenticado.');
        }

        if ((int) $pedido->mesero_idUsuario !== (int) $user->getAuthIdentifier()) {
            abort(403, 'No autorizado para este pedido.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePedidoCompleto(Pedido $pedido): array
    {
        return [
            'idPedido' => $pedido->idPedido,
            'estado' => $pedido->estado,
            'notas' => $pedido->notas,
            'creado_en' => $pedido->creado_en?->toIso8601String(),
            'actualizado_en' => $pedido->actualizado_en?->toIso8601String(),
            'mesa' => $pedido->mesa ? [
                'idMesa' => $pedido->mesa->idMesa,
                'numero' => $pedido->mesa->numero,
                'nombre' => $pedido->mesa->nombre,
            ] : null,
            'detalles' => $pedido->detalles->map(fn ($d) => [
                'idPedidoDetalle' => $d->idPedidoDetalle,
                'cantidad' => $d->cantidad,
                'precio_unitario' => $d->precio_unitario,
                'nota' => $d->nota,
                'estado_item' => $d->estado_item,
                'producto' => $d->producto ? [
                    'nombreProducto' => $d->producto->nombreProducto,
                    'tipo' => $d->producto->tipo,
                ] : null,
            ]),
        ];
    }
}
