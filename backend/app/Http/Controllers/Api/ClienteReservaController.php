<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesa;
use App\Models\Reserva;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteReservaController extends Controller
{
    public function mesas(Request $request): JsonResponse
    {
        $mesas = Mesa::query()
            ->where('activa', true)
            ->orderBy('numero')
            ->get(['idMesa', 'numero', 'nombre', 'capacidad']);

        return response()->json([
            'data' => $mesas->map(function (Mesa $m) {
                $nombre = trim((string) ($m->nombre ?? ''));
                $label = $nombre !== ''
                    ? "Mesa {$m->numero} — {$nombre}"
                    : "Mesa {$m->numero}";

                return [
                    'idMesa' => $m->idMesa,
                    'numero' => $m->numero,
                    'nombre' => $m->nombre,
                    'capacidad' => $m->capacidad,
                    'label' => $label,
                ];
            }),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $items = Reserva::query()
            ->with([
                'mesa:idMesa,numero,nombre,capacidad',
            ])
            ->where('cliente_idUsuario', $request->user()->getAuthIdentifier())
            ->orderByDesc('fecha_hora')
            ->limit(80)
            ->get();

        return response()->json([
            'data' => $items->map(fn (Reserva $r) => $this->serializeReserva($r)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha' => ['required', 'date', 'after_or_equal:today'],
            'hora' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'mesa_idMesa' => ['nullable', 'integer', 'exists:mesa,idMesa'],
            'num_personas' => ['required', 'integer', 'min:1', 'max:40'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        $fechaHora = Carbon::parse($data['fecha'].' '.$data['hora'].':00');
        if ($fechaHora->isPast()) {
            return response()->json([
                'message' => 'La fecha y hora deben ser futuras.',
            ], 422);
        }

        if (! empty($data['mesa_idMesa'])) {
            $mesa = Mesa::query()
                ->where('idMesa', $data['mesa_idMesa'])
                ->where('activa', true)
                ->first();

            if (! $mesa) {
                return response()->json(['message' => 'La mesa no está disponible.'], 422);
            }

            if ((int) $data['num_personas'] > (int) $mesa->capacidad) {
                return response()->json([
                    'message' => 'El número de personas supera la capacidad de esa mesa.',
                ], 422);
            }

            $ventanaIni = $fechaHora->copy()->subMinutes(120);
            $ventanaFin = $fechaHora->copy()->addMinutes(120);

            $hayChoque = Reserva::query()
                ->where('mesa_idMesa', $mesa->idMesa)
                ->whereIn('estado', ['SOLICITADA', 'CONFIRMADA'])
                ->whereBetween('fecha_hora', [$ventanaIni, $ventanaFin])
                ->exists();

            if ($hayChoque) {
                return response()->json([
                    'message' => 'Esa mesa ya tiene una reserva activa cercana a esa hora.',
                ], 422);
            }
        }

        $reserva = Reserva::create([
            'cliente_idUsuario' => $request->user()->getAuthIdentifier(),
            'mesa_idMesa' => $data['mesa_idMesa'] ?? null,
            'fecha_hora' => $fechaHora,
            'num_personas' => $data['num_personas'],
            'estado' => 'SOLICITADA',
            'notas' => $data['notas'] ?: null,
            'creado_en' => now(),
        ]);

        $reserva->load('mesa:idMesa,numero,nombre,capacidad');

        return response()->json([
            'message' => 'Reserva registrada. El restaurante revisará tu solicitud.',
            'data' => $this->serializeReserva($reserva),
        ], 201);
    }

    private function serializeReserva(Reserva $r): array
    {
        /** @var \Carbon\Carbon|null $fh */
        $fh = $r->fecha_hora;

        /** @var \Carbon\Carbon|null $creado */
        $creado = $r->creado_en;

        return [
            'idReserva' => $r->idReserva,
            'fecha_hora' => $fh ? $fh->timezone(config('app.timezone'))->format(\DateTime::ATOM) : null,
            'num_personas' => $r->num_personas,
            'estado' => $r->estado,
            'notas' => $r->notas,
            'creado_en' => $creado ? $creado->timezone(config('app.timezone'))->format(\DateTime::ATOM) : null,
            'mesa' => $r->mesa ? [
                'idMesa' => $r->mesa->idMesa,
                'numero' => $r->mesa->numero,
                'nombre' => $r->mesa->nombre,
                'capacidad' => $r->mesa->capacidad,
            ] : null,
        ];
    }
}
