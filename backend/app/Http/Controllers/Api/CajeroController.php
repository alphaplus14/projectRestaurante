<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesa;
use App\Models\Pago;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Models\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajeroController extends Controller
{
    /**
     * Cuentas listas para cobrar (sin venta registrada).
     */
    public function cuentasPendientes(): JsonResponse
    {
        $pedidos = Pedido::query()
            ->whereIn('estado', ['LISTO', 'ENTREGADO'])
            ->whereDoesntHave('venta')
            ->with([
                'mesa:idMesa,numero,nombre',
                'mesero:idUsuario,nombre,apellido',
                'detalles' => fn ($q) => $q
                    ->where('estado_item', '!=', 'CANCELADO')
                    ->orderBy('idPedidoDetalle')
                    ->with('producto:idProducto,nombreProducto'),
            ])
            ->orderBy('actualizado_en')
            ->get()
            ->filter(fn (Pedido $p) => $this->pedidoListoParaCobro($p))
            ->values();

        return response()->json([
            'data' => $pedidos->map(fn (Pedido $p) => $this->serializeCuentaResumen($p)),
        ]);
    }

    public function showPedido(Pedido $pedido): JsonResponse
    {
        if (! in_array($pedido->estado, ['LISTO', 'ENTREGADO'], true)) {
            return response()->json([
                'message' => 'Este pedido no está listo para cobrar.',
            ], 422);
        }

        if ($pedido->venta()->exists()) {
            return response()->json([
                'message' => 'Esta cuenta ya fue cobrada.',
            ], 422);
        }

        $pedido->load([
            'mesa:idMesa,numero,nombre',
            'mesero:idUsuario,nombre,apellido',
            'detalles' => fn ($q) => $q
                ->where('estado_item', '!=', 'CANCELADO')
                ->orderBy('idPedidoDetalle')
                ->with('producto:idProducto,nombreProducto,tipo'),
        ]);

        if (! $this->pedidoListoParaCobro($pedido)) {
            return response()->json([
                'message' => 'Aún hay platos en cocina. Espera a que estén listos.',
            ], 422);
        }

        return response()->json([
            'data' => $this->serializeCuentaDetalle($pedido),
        ]);
    }

    public function cobrar(Request $request, Pedido $pedido): JsonResponse
    {
        /** @var Usuario $cajero */
        $cajero = $request->user();

        if (! in_array($pedido->estado, ['LISTO', 'ENTREGADO'], true)) {
            return response()->json([
                'message' => 'Este pedido no está listo para cobrar.',
            ], 422);
        }

        if ($pedido->venta()->exists()) {
            return response()->json([
                'message' => 'Esta cuenta ya fue cobrada.',
            ], 422);
        }

        $pedido->load([
            'mesa:idMesa,numero,nombre',
            'mesero:idUsuario,nombre,apellido',
            'detalles' => fn ($q) => $q->where('estado_item', '!=', 'CANCELADO'),
        ]);

        if (! $this->pedidoListoParaCobro($pedido)) {
            return response()->json([
                'message' => 'Aún hay platos en cocina. Espera a que estén listos.',
            ], 422);
        }

        $data = $request->validate([
            'impuesto_o_servicio' => ['nullable', 'numeric', 'min:0'],
            'pagos' => ['required', 'array', 'min:1'],
            'pagos.*.metodo' => ['required', 'string', 'in:EFECTIVO,TARJETA,NEQUI,DAVIPLATA'],
            'pagos.*.valor' => ['required', 'numeric', 'min:0.01'],
            'pagos.*.referencia' => ['nullable', 'string', 'max:120'],
        ]);

        $subtotal = round($this->calcularSubtotal($pedido), 2);
        $impuesto = round((float) ($data['impuesto_o_servicio'] ?? 0), 2);
        $total = round($subtotal + $impuesto, 2);
        $sumPagos = round(collect($data['pagos'])->sum(fn ($p) => (float) $p['valor']), 2);

        if (abs($sumPagos - $total) > 0.01) {
            return response()->json([
                'message' => 'La suma de los pagos debe coincidir con el total a cobrar.',
                'total_esperado' => $total,
                'total_pagos' => $sumPagos,
            ], 422);
        }

        $ahora = now();

        $venta = DB::transaction(function () use ($pedido, $cajero, $data, $subtotal, $impuesto, $total, $ahora) {
            $venta = Venta::create([
                'pedido_idPedido' => $pedido->idPedido,
                'subtotal' => $subtotal,
                'impuesto_o_servicio' => $impuesto,
                'total' => $total,
                'registrada_en' => $ahora,
                'cajero_idUsuario' => $cajero->idUsuario,
            ]);

            foreach ($data['pagos'] as $pagoData) {
                Pago::create([
                    'venta_idVenta' => $venta->idVenta,
                    'metodo' => $pagoData['metodo'],
                    'valor' => round((float) $pagoData['valor'], 2),
                    'referencia' => $pagoData['referencia'] ?? null,
                    'pagado_en' => $ahora,
                ]);
            }

            $pedido->estado = 'CERRADO';
            $pedido->cerrado_en = $ahora;
            $pedido->actualizado_en = $ahora;
            $pedido->save();

            $mesa = Mesa::query()->where('idMesa', $pedido->mesa_idMesa)->first();
            if ($mesa) {
                $mesa->estado = 'LIBRE';
                $mesa->save();
            }

            return $venta;
        });

        $venta->load([
            'pagos',
            'pedido.mesa:idMesa,numero,nombre',
            'pedido.mesero:idUsuario,nombre,apellido',
            'pedido.detalles' => fn ($q) => $q
                ->where('estado_item', '!=', 'CANCELADO')
                ->orderBy('idPedidoDetalle')
                ->with('producto:idProducto,nombreProducto,tipo'),
        ]);

        return response()->json([
            'message' => 'Cuenta cobrada. La mesa quedó libre.',
            'data' => $this->serializeVenta($venta),
        ], 201);
    }

    public function ventasHoy(Request $request): JsonResponse
    {
        /** @var Usuario $cajero */
        $cajero = $request->user();
        $hoy = now()->toDateString();

        $ventas = Venta::query()
            ->with([
                'pagos',
                'pedido.mesa:idMesa,numero,nombre',
            ])
            ->whereDate('registrada_en', $hoy)
            ->where('cajero_idUsuario', $cajero->idUsuario)
            ->orderByDesc('registrada_en')
            ->get();

        return response()->json([
            'fecha' => $hoy,
            'total_dia' => round($ventas->sum('total'), 2),
            'num_ventas' => $ventas->count(),
            'data' => $ventas->map(fn (Venta $v) => $this->serializeVenta($v)),
        ]);
    }

    private function pedidoListoParaCobro(Pedido $pedido): bool
    {
        if ($pedido->detalles->isEmpty()) {
            return false;
        }

        return $pedido->detalles
            ->where('estado_item', '!=', 'CANCELADO')
            ->every(fn ($d) => $d->estado_item === 'LISTO');
    }

    private function calcularSubtotal(Pedido $pedido): float
    {
        return (float) $pedido->detalles
            ->where('estado_item', '!=', 'CANCELADO')
            ->sum(fn ($d) => (float) $d->precio_unitario * (int) $d->cantidad);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeCuentaResumen(Pedido $pedido): array
    {
        $subtotal = $this->calcularSubtotal($pedido);
        $lineas = $pedido->detalles->where('estado_item', '!=', 'CANCELADO');
        $unidades = (int) $lineas->sum('cantidad');

        return [
            'idPedido' => $pedido->idPedido,
            'estado' => $pedido->estado,
            'creado_en' => $pedido->creado_en?->toIso8601String(),
            'actualizado_en' => $pedido->actualizado_en?->toIso8601String(),
            'subtotal' => round($subtotal, 2),
            'num_lineas' => $lineas->count(),
            'total_unidades' => $unidades,
            'mesa' => $pedido->mesa ? [
                'idMesa' => $pedido->mesa->idMesa,
                'numero' => $pedido->mesa->numero,
                'nombre' => $pedido->mesa->nombre,
            ] : null,
            'mesero' => $pedido->mesero ? [
                'idUsuario' => $pedido->mesero->idUsuario,
                'nombre' => $pedido->mesero->nombre,
                'apellido' => $pedido->mesero->apellido,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeCuentaDetalle(Pedido $pedido): array
    {
        $resumen = $this->serializeCuentaResumen($pedido);

        $resumen['detalles'] = $pedido->detalles->map(fn ($d) => [
            'idPedidoDetalle' => $d->idPedidoDetalle,
            'cantidad' => $d->cantidad,
            'precio_unitario' => $d->precio_unitario,
            'nota' => $d->nota,
            'estado_item' => $d->estado_item,
            'producto' => $d->producto ? [
                'nombreProducto' => $d->producto->nombreProducto,
                'tipo' => $d->producto->tipo,
            ] : null,
        ]);

        return $resumen;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeVenta(Venta $venta): array
    {
        $pedido = $venta->pedido;

        return [
            'idVenta' => $venta->idVenta,
            'subtotal' => $venta->subtotal,
            'impuesto_o_servicio' => $venta->impuesto_o_servicio,
            'total' => $venta->total,
            'registrada_en' => $venta->registrada_en?->toIso8601String(),
            'pagos' => $venta->pagos->map(fn (Pago $p) => [
                'idPago' => $p->idPago,
                'metodo' => $p->metodo,
                'valor' => $p->valor,
                'referencia' => $p->referencia,
                'pagado_en' => $p->pagado_en?->toIso8601String(),
            ]),
            'pedido' => $pedido ? [
                'idPedido' => $pedido->idPedido,
                'estado' => $pedido->estado,
                'mesa' => $pedido->mesa ? [
                    'idMesa' => $pedido->mesa->idMesa,
                    'numero' => $pedido->mesa->numero,
                    'nombre' => $pedido->mesa->nombre,
                ] : null,
                'mesero' => $pedido->mesero ? [
                    'nombre' => $pedido->mesero->nombre,
                    'apellido' => $pedido->mesero->apellido,
                ] : null,
            ] : null,
        ];
    }
}
