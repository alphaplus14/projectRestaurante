import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';

const METODOS_PAGO = [
    { value: '', label: 'Todos' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'DAVIPLATA', label: 'Daviplata' },
];

const ESTADOS = [
    { value: 'todas', label: 'Todas' },
    { value: 'ACTIVA', label: 'Activas' },
    { value: 'CANCELADA', label: 'Canceladas' },
];

const PAGE_SIZE = 10;

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatMesa(mesa) {
    if (!mesa) return '—';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return `Mesa #${mesa.idMesa}`;
}

function formatMoney(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n));
}

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

function hoyLocal() {
    return new Date().toISOString().slice(0, 10);
}

function hace30Dias() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}

export function AdminVentasPage() {
    const [ventas, setVentas] = useState([]);
    const [resumen, setResumen] = useState({ total_periodo: 0, num_ventas: 0, num_canceladas: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [desde, setDesde] = useState(hace30Dias);
    const [hasta, setHasta] = useState(hoyLocal);
    const [estado, setEstado] = useState('todas');
    const [cajero, setCajero] = useState('');
    const [producto, setProducto] = useState('');
    const [metodo, setMetodo] = useState('');
    const [pagina, setPagina] = useState(1);

    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(ventas.length / PAGE_SIZE)), [ventas.length]);
    const ventasPagina = useMemo(() => {
        const start = (pagina - 1) * PAGE_SIZE;
        return ventas.slice(start, start + PAGE_SIZE);
    }, [ventas, pagina]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ desde, hasta, estado });
            if (cajero.trim()) params.set('cajero', cajero.trim());
            if (producto.trim()) params.set('producto', producto.trim());
            if (metodo) params.set('metodo', metodo);
            const res = await apiFetch(`/api/admin/ventas?${params}`);
            setVentas(Array.isArray(res?.data) ? res.data : []);
            setResumen({
                total_periodo: res?.total_periodo ?? 0,
                num_ventas: res?.num_ventas ?? 0,
                num_canceladas: res?.num_canceladas ?? 0,
            });
        } catch (e) {
            setVentas([]);
            setError(e?.message || 'No se pudieron cargar las ventas.');
        } finally {
            setLoading(false);
        }
    }, [desde, hasta, estado, cajero, producto, metodo]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        void apiFetch('/api/admin/ventas/notificaciones/marcar-vistas', { method: 'POST' }).catch(() => {});
        window.dispatchEvent(new Event('napa:ventas-vistas'));
    }, []);

    useEffect(() => {
        setPagina(1);
    }, [desde, hasta, estado, cajero, producto, metodo]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    return (
        <AdminLayout title="Ventas">
            <div className="space-y-6 max-w-6xl">
                <div>
                    <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Historial de ventas</h1>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                        Todas las ventas registradas por caja. Las cancelaciones quedan registradas con motivo.
                    </p>
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {ESTADOS.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setEstado(f.value)}
                                className={classNames(
                                    'rounded-lg border px-3 py-1.5 text-xs font-medium',
                                    estado === f.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400',
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="text-sm">
                            <span className="block text-xs text-stone-500 mb-1">Desde</span>
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm" />
                        </label>
                        <label className="text-sm">
                            <span className="block text-xs text-stone-500 mb-1">Hasta</span>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm" />
                        </label>
                        <label className="text-sm flex-1 min-w-[120px]">
                            <span className="block text-xs text-stone-500 mb-1">Cajero</span>
                            <input type="text" value={cajero} onChange={(e) => setCajero(e.target.value)} placeholder="Nombre…" className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm" />
                        </label>
                        <label className="text-sm flex-1 min-w-[120px]">
                            <span className="block text-xs text-stone-500 mb-1">Producto</span>
                            <input type="text" value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Buscar…" className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm" />
                        </label>
                        <label className="text-sm">
                            <span className="block text-xs text-stone-500 mb-1">Pago</span>
                            <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm">
                                {METODOS_PAGO.map((m) => (
                                    <option key={m.value || 'todos'} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </label>
                        <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
                            {loading ? 'Cargando…' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
                    <div>
                        <div className="text-xs text-stone-500 uppercase tracking-wide">Total activas</div>
                        <div className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">{formatMoney(resumen.total_periodo)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-stone-500 uppercase tracking-wide">Ventas</div>
                        <div className="text-2xl font-bold tabular-nums">{resumen.num_ventas}</div>
                    </div>
                    <div>
                        <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Canceladas</div>
                        <div className="text-2xl font-bold tabular-nums text-red-700 dark:text-red-300">{resumen.num_canceladas}</div>
                    </div>
                </div>

                {error ? (
                    <p className="text-sm text-red-700 dark:text-red-300 rounded-xl border border-red-300/50 px-3 py-2">{error}</p>
                ) : null}

                {loading ? (
                    <p className="text-sm text-stone-500 py-12 text-center">Cargando ventas…</p>
                ) : ventas.length === 0 ? (
                    <p className="text-sm text-stone-500 py-12 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">No hay ventas con estos filtros.</p>
                ) : (
                    <>
                        <ul className="space-y-3">
                            {ventasPagina.map((v) => {
                                const cancelada = v.estado === 'CANCELADA';
                                const cajeroNombre = v.cajero ? `${v.cajero.nombre ?? ''} ${v.cajero.apellido ?? ''}`.trim() : '—';
                                return (
                                    <li
                                        key={v.idVenta}
                                        className={classNames(
                                            'rounded-xl border p-4',
                                            cancelada
                                                ? 'border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20'
                                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
                                        )}
                                    >
                                        <div className="flex flex-wrap justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-stone-900 dark:text-stone-50">
                                                        Venta #{v.idVenta} · {formatMesa(v.pedido?.mesa)}
                                                    </span>
                                                    <span
                                                        className={classNames(
                                                            'text-xs font-semibold uppercase px-2 py-0.5 rounded-md border',
                                                            cancelada
                                                                ? 'border-red-400/50 text-red-800 dark:text-red-200 bg-red-100/50 dark:bg-red-950/40'
                                                                : 'border-emerald-400/50 text-emerald-800 dark:text-emerald-200 bg-emerald-100/50 dark:bg-emerald-950/40',
                                                        )}
                                                    >
                                                        {cancelada ? 'Cancelada' : 'Activa'}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-stone-500">
                                                    Pedido #{v.pedido?.idPedido} · Cajero: {cajeroNombre}
                                                </div>
                                                <div className="mt-0.5 text-xs text-stone-500">{formatFechaHora(v.registrada_en)}</div>
                                            </div>
                                            <div className={classNames('font-bold tabular-nums', cancelada ? 'text-stone-500 line-through' : 'text-blue-700 dark:text-blue-300')}>
                                                {formatMoney(v.total)}
                                            </div>
                                        </div>
                                        {(v.pedido?.detalles ?? []).length > 0 ? (
                                            <ul className="mt-2 text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                                                {v.pedido.detalles.map((d) => (
                                                    <li key={d.idPedidoDetalle}>{d.producto?.nombreProducto ?? 'Ítem'} ×{d.cantidad}</li>
                                                ))}
                                            </ul>
                                        ) : null}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(v.pagos ?? []).map((p) => (
                                                <span key={p.idPago} className="inline-flex rounded-full border border-stone-200 dark:border-stone-700 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-400">
                                                    {p.metodo}: {formatMoney(p.valor)}
                                                </span>
                                            ))}
                                        </div>
                                        {cancelada && v.motivo_cancelacion ? (
                                            <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm">
                                                <span className="text-xs font-semibold uppercase text-red-700 dark:text-red-300 block mb-1">Motivo de cancelación</span>
                                                <p className="text-red-900 dark:text-red-100">{v.motivo_cancelacion}</p>
                                                {v.cancelada_en ? (
                                                    <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">
                                                        Cancelada el {formatFechaHora(v.cancelada_en)}
                                                        {v.cancelada_por ? ` por ${v.cancelada_por.nombre} ${v.cancelada_por.apellido}` : ''}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                        {totalPaginas > 1 ? (
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm disabled:opacity-40">Anterior</button>
                                <span className="text-sm text-stone-500 tabular-nums">{pagina} / {totalPaginas}</span>
                                <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm disabled:opacity-40">Siguiente</button>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
