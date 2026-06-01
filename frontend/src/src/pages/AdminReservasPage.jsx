import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAlertError } from '../utils/adminAlerts';

const FILTROS = [
    { value: 'todas', label: 'Todas' },
    { value: 'proximas', label: 'Próximas' },
    { value: 'pasadas', label: 'Pasadas' },
    { value: 'canceladas', label: 'Canceladas' },
];

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatFechaHora(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function formatFranja(inicio, fin) {
    if (!inicio) return '—';
    const fmt = (iso) =>
        new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (!fin) return fmt(inicio);
    return `${fmt(inicio)} – ${fmt(fin)}`;
}

function etiquetaEstado(estado) {
    const map = {
        CONFIRMADA: 'Confirmada',
        SOLICITADA: 'Solicitada',
        CANCELADA: 'Cancelada',
        COMPLETADA: 'Completada',
        NO_ASISTIO: 'No asistió',
    };
    return map[estado] || estado;
}

function estadoBadgeClass(estado) {
    const e = String(estado || '').toUpperCase();
    if (e === 'CONFIRMADA' || e === 'SOLICITADA') {
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30';
    }
    if (e === 'CANCELADA') {
        return 'bg-red-500/15 text-red-800 dark:text-red-200 border-red-500/30';
    }
    if (e === 'COMPLETADA') {
        return 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-600';
    }
    return 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30';
}

export function AdminReservasPage() {
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('proximas');
    const [reservas, setReservas] = useState([]);
    const [conteos, setConteos] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/admin/reservas?filtro=${encodeURIComponent(filtro)}`);
            setReservas(Array.isArray(res?.data) ? res.data : []);
            setConteos(res?.conteos ?? {});
        } catch (err) {
            setReservas([]);
            void adminAlertError(err, 'No se pudieron cargar las reservas');
        } finally {
            setLoading(false);
        }
    }, [filtro]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AdminLayout title="Reservas">
            <div className="space-y-6 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Reservas del local</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            Reservas hechas por clientes desde la web: fecha, franja, personas y estado.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="shrink-0 rounded-lg bg-orange-700 hover:bg-orange-600 disabled:opacity-60 text-stone-50 font-semibold text-sm px-4 py-2"
                    >
                        {loading ? 'Actualizando…' : 'Actualizar'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {FILTROS.map((f) => {
                        const count = conteos[f.value];
                        const activo = filtro === f.value;
                        return (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFiltro(f.value)}
                                className={classNames(
                                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                                    activo
                                        ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-amber-500/40',
                                )}
                            >
                                {f.label}
                                {count != null ? (
                                    <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
                    {loading ? (
                        <p className="p-10 text-center text-stone-600 dark:text-stone-400">Cargando reservas…</p>
                    ) : reservas.length === 0 ? (
                        <p className="p-10 text-center text-stone-600 dark:text-stone-400">
                            No hay reservas en este filtro.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[800px]">
                                <thead className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">#</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">
                                            Reservado por
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Contacto</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Fecha y hora</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Franja</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Personas</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Mesa</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Estado</th>
                                        <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Notas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                    {reservas.map((r) => (
                                        <tr
                                            key={r.idReserva}
                                            className="hover:bg-stone-50/80 dark:hover:bg-stone-950/40"
                                        >
                                            <td className="px-4 py-3 tabular-nums text-stone-600 dark:text-stone-400">
                                                {r.idReserva}
                                            </td>
                                            <td className="px-4 py-3 min-w-[160px]">
                                                <div className="font-semibold text-base text-stone-900 dark:text-stone-50">
                                                    {r.reservado_por ||
                                                        r.cliente?.nombre_completo ||
                                                        [r.cliente?.nombre, r.cliente?.apellido]
                                                            .filter(Boolean)
                                                            .join(' ') ||
                                                        '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 min-w-[140px] text-stone-600 dark:text-stone-400">
                                                {r.cliente?.correo ? (
                                                    <div className="text-xs truncate max-w-[200px]" title={r.cliente.correo}>
                                                        {r.cliente.correo}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs">—</span>
                                                )}
                                                {r.cliente?.telefono ? (
                                                    <div className="text-xs mt-1 tabular-nums">{r.cliente.telefono}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-stone-800 dark:text-stone-200">
                                                {formatFechaHora(r.fecha_hora)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-stone-700 dark:text-stone-300">
                                                {formatFranja(r.fecha_hora, r.fecha_hora_fin)}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums font-medium text-stone-900 dark:text-stone-50">
                                                {r.num_personas}
                                            </td>
                                            <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                                                {r.mesa
                                                    ? r.mesa.nombre
                                                        ? `Mesa ${r.mesa.numero} (${r.mesa.nombre})`
                                                        : `Mesa ${r.mesa.numero}`
                                                    : 'Por asignar'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={classNames(
                                                        'inline-flex text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border',
                                                        estadoBadgeClass(r.estado),
                                                    )}
                                                >
                                                    {etiquetaEstado(r.estado)}
                                                </span>
                                                {r.estado === 'CANCELADA' && r.motivo_cancelacion ? (
                                                    <p
                                                        className="mt-1 text-[11px] text-red-700 dark:text-red-300 max-w-[180px] line-clamp-2"
                                                        title={r.motivo_cancelacion}
                                                    >
                                                        {r.motivo_cancelacion}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-stone-600 dark:text-stone-400 max-w-[160px]">
                                                <span className="line-clamp-2" title={r.notas || ''}>
                                                    {r.notas || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-500">
                    Registrada en sistema: columna implícita por orden. Máximo 200 registros por consulta.
                </p>
            </div>
        </AdminLayout>
    );
}
