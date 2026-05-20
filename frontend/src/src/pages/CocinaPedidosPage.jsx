import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

const COLS = [
    { key: 'PENDIENTE', estado: 'PENDIENTE', title: 'Nuevos', subtitle: 'Recién entrados desde salón' },
    { key: 'EN_PREPARACION', estado: 'EN_PREPARACION', title: 'En preparación', subtitle: 'En la línea' },
    { key: 'LISTO', estado: 'LISTO', title: 'Listos', subtitle: 'El mesero puede retirar' },
];

function formatMesa(mesa) {
    if (!mesa) return 'Sin mesa';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return `Mesa #${mesa.idMesa}`;
}

function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function PedidoCard({ pedido, onAdvance, busyId }) {
    const busy = busyId === pedido.idPedido;
    let action = null;
    if (pedido.estado === 'PENDIENTE') {
        action = { label: 'Tomar pedido', next: 'EN_PREPARACION' };
    } else if (pedido.estado === 'EN_PREPARACION') {
        action = { label: 'Marcar listo', next: 'LISTO' };
    }

    return (
        <article
            className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-stone-900/80 p-4 shadow-sm"
            aria-label={`Pedido ${pedido.idPedido}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs uppercase tracking-wide text-stone-600 dark:text-stone-500">Pedido</div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-stone-50 tabular-nums">#{pedido.idPedido}</div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">{formatMesa(pedido.mesa)}</div>
                    <div className="text-sm text-stone-600 dark:text-stone-400">{formatTime(pedido.creado_en)}</div>
                </div>
            </div>

            {pedido.mesero?.nombre ? (
                <div className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    Mesero: <span className="text-stone-700 dark:text-stone-300">{pedido.mesero.nombre}</span>
                </div>
            ) : null}

            {pedido.notas ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100/90">
                    {pedido.notas}
                </p>
            ) : null}

            <ul className="mt-4 space-y-2 border-t border-stone-200 dark:border-white/10 pt-3">
                {pedido.detalles?.map((l) => (
                    <li key={l.idPedidoDetalle} className="flex gap-3 text-sm">
                        <span className="font-semibold text-orange-700 dark:text-orange-200 tabular-nums shrink-0">{l.cantidad}×</span>
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-stone-900 dark:text-stone-100 truncate">
                                {l.producto?.nombreProducto ?? 'Producto'}
                            </div>
                            {l.nota ? <div className="text-stone-600 dark:text-stone-500 text-xs mt-0.5">Nota: {l.nota}</div> : null}
                        </div>
                    </li>
                ))}
            </ul>

            {action ? (
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => onAdvance(pedido.idPedido, action.next)}
                    className="mt-4 w-full rounded-xl bg-orange-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {busy ? 'Guardando…' : action.label}
                </button>
            ) : (
                <p className="mt-4 text-center text-sm text-stone-600 dark:text-stone-500">Esperando al mesero</p>
            )}
        </article>
    );
}

export function CocinaPedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const fetchPedidos = useCallback(async () => {
        try {
            const res = await apiFetch('/api/cocina/pedidos');
            setPedidos(Array.isArray(res?.data) ? res.data : []);
            setLoadError('');
        } catch (e) {
            setLoadError(e?.message || 'No se pudo cargar la cola de cocina.');
        }
    }, []);

    useEffect(() => {
        fetchPedidos();
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') fetchPedidos();
        }, 6000);
        return () => clearInterval(id);
    }, [fetchPedidos]);

    const byEstado = useMemo(() => {
        const map = { PENDIENTE: [], EN_PREPARACION: [], LISTO: [] };
        for (const p of pedidos) {
            if (map[p.estado]) map[p.estado].push(p);
        }
        return map;
    }, [pedidos]);

    async function onAdvance(idPedido, estado) {
        setBusyId(idPedido);
        try {
            await apiFetch(`/api/cocina/pedidos/${idPedido}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado }),
            });
            await fetchPedidos();
        } catch (e) {
            setLoadError(e?.message || 'No se pudo actualizar el pedido.');
        } finally {
            setBusyId(null);
        }
    }

    function onSalir() {
        clearToken();
        window.location.href = '/login-cocina';
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
            <header className="sticky top-0 z-10 border-b border-stone-200 dark:border-white/10 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-[1600px] px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Cocina</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Pedidos del salón · actualización cada 6 s</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => fetchPedidos()}
                            className="rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10"
                        >
                            Actualizar
                        </button>
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-xl border border-stone-200 dark:border-white/15 px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-transparent"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1600px] px-4 py-6">
                {loadError ? (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                        {loadError}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {COLS.map((col) => (
                        <section key={col.key} className="flex flex-col min-h-[200px]">
                            <div className="mb-3">
                                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{col.title}</h2>
                                <p className="text-xs text-stone-600 dark:text-stone-500">{col.subtitle}</p>
                                <div className="mt-1 text-sm text-stone-600 dark:text-stone-400 tabular-nums">
                                    {byEstado[col.estado]?.length ?? 0} pedido(s)
                                </div>
                            </div>
                            <div className="flex flex-col gap-4 flex-1">
                                {(byEstado[col.estado] ?? []).map((p) => (
                                    <PedidoCard key={p.idPedido} pedido={p} onAdvance={onAdvance} busyId={busyId} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <p className="mt-10 text-center text-sm text-stone-600">
                    <Link to="/cliente" className="text-stone-600 dark:text-stone-500 hover:text-stone-600 dark:text-stone-400">
                        Sitio para clientes
                    </Link>
                </p>
            </div>
        </div>
    );
}
