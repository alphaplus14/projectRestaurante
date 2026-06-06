import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAlertError } from '../utils/adminAlerts';

function formatFechaHora(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-CO', {
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

function formatMesa(mesa) {
    if (!mesa) return '—';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return 'Mesa';
}

export function AdminPlatosCanceladosPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (desde) params.set('desde', desde);
            if (hasta) params.set('hasta', hasta);
            const qs = params.toString();
            const res = await apiFetch(`/api/admin/pedidos-platos-cancelados${qs ? `?${qs}` : ''}`);
            setItems(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setItems([]);
            void adminAlertError(err, 'No se pudo cargar el historial de platos cancelados');
        } finally {
            setLoading(false);
        }
    }, [desde, hasta]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AdminLayout title="Platos cancelados">
            <div className="space-y-6 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                            Platos cancelados en cocina
                        </h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            Cuando cocina no puede preparar un ítem, queda registrado el motivo, mesa y cocinero.
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

                <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
                    <label className="text-sm">
                        <span className="block text-stone-600 dark:text-stone-400 mb-1">Desde</span>
                        <input
                            type="date"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-stone-600 dark:text-stone-400 mb-1">Hasta</span>
                        <input
                            type="date"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => {
                            setDesde('');
                            setHasta('');
                        }}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        Limpiar fechas
                    </button>
                </div>

                {loading && items.length === 0 ? (
                    <p className="text-sm text-stone-600 dark:text-stone-400">Cargando…</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-center text-stone-600 dark:text-stone-400 py-12 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                        No hay platos cancelados con estos filtros.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((it) => (
                            <li
                                key={it.idPedidoDetalle}
                                className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-stone-900 dark:text-stone-50">
                                            {it.cantidad}× {it.producto?.nombreProducto ?? 'Producto'}
                                        </p>
                                        <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                                            Pedido #{it.idPedido} · {formatMesa(it.pedido?.mesa)}
                                            {it.pedido?.mesero_nombre ? ` · ${it.pedido.mesero_nombre}` : ''}
                                        </p>
                                    </div>
                                    <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
                                        {formatFechaHora(it.cancelado_en)}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-red-900 dark:text-red-100 leading-snug">
                                    <span className="font-medium">Motivo:</span> {it.motivo_cancelacion}
                                </p>
                                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                                    Cocinero: {it.cancelado_por_nombre}
                                    {it.pedido?.estado ? ` · Estado pedido: ${it.pedido.estado}` : ''}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AdminLayout>
    );
}
