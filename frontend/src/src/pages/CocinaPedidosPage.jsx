import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

const PAGE_SIZE = 8;
const CANCELADOS_VISTOS_KEY = 'cocina_pedidos_cancelados_vistos';

function leerCanceladosVistos() {
    try {
        const raw = localStorage.getItem(CANCELADOS_VISTOS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr.map(Number).filter(Boolean) : []);
    } catch {
        return new Set();
    }
}

function guardarCanceladosVistos(ids) {
    try {
        localStorage.setItem(CANCELADOS_VISTOS_KEY, JSON.stringify([...ids]));
    } catch {
        /* ignore */
    }
}

const SEMAFORO = [
    {
        key: 'PENDIENTE',
        label: 'Nuevos',
        dotClass: 'bg-red-600 ring-red-600/40',
        activeTab: 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100',
    },
    {
        key: 'EN_PREPARACION',
        label: 'En preparación',
        dotClass: 'bg-yellow-500 ring-yellow-500/40',
        activeTab: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-100',
    },
    {
        key: 'LISTO',
        label: 'Listos',
        dotClass: 'bg-[#4d7c6f] ring-[#4d7c6f]/40',
        activeTab: 'border-[#4d7c6f] bg-[#4d7c6f]/10 text-stone-900 dark:text-stone-100',
    },
    {
        key: 'CANCELADO',
        label: 'Cancelados',
        dotClass: 'bg-red-700 ring-red-700/40',
        activeTab: 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100',
    },
];

const SORT_OPTIONS = [
    { value: 'fecha_asc', label: 'Más antiguos primero' },
    { value: 'fecha_desc', label: 'Más recientes primero' },
    { value: 'tamano_desc', label: 'Pedido más grande' },
    { value: 'tamano_asc', label: 'Pedido más pequeño' },
];

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

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

function pedidoTamano(pedido) {
    const lineas = pedido.detalles?.length ?? 0;
    const unidades = (pedido.detalles ?? []).reduce((s, l) => s + Number(l.cantidad || 0), 0);
    return { lineas, unidades };
}

function sortPedidos(list, sortBy) {
    const copy = [...list];
    copy.sort((a, b) => {
        if (sortBy === 'fecha_asc') {
            return new Date(a.creado_en || 0) - new Date(b.creado_en || 0);
        }
        if (sortBy === 'fecha_desc') {
            return new Date(b.creado_en || 0) - new Date(a.creado_en || 0);
        }
        const ta = pedidoTamano(a).unidades;
        const tb = pedidoTamano(b).unidades;
        if (sortBy === 'tamano_desc') return tb - ta || b.idPedido - a.idPedido;
        if (sortBy === 'tamano_asc') return ta - tb || a.idPedido - b.idPedido;
        return 0;
    });
    return copy;
}

function PedidoResumenCard({ pedido, onAdvance, onVerDetalle, busyId }) {
    const busy = busyId === pedido.idPedido;
    const { lineas, unidades } = pedidoTamano(pedido);
    const tieneNotasMesero = (pedido.detalles ?? []).some((l) => l.nota?.trim());
    const esCancelado = pedido.estado === 'CANCELADO';

    let action = null;
    if (!esCancelado && pedido.estado === 'PENDIENTE') {
        action = { label: 'Tomar pedido', next: 'EN_PREPARACION', className: 'bg-red-700 hover:bg-red-600' };
    } else if (!esCancelado && pedido.estado === 'EN_PREPARACION') {
        action = { label: 'Marcar listo', next: 'LISTO', className: 'bg-yellow-600 hover:bg-yellow-500 text-stone-950' };
    }

    return (
        <article
            className={classNames(
                'rounded-2xl border p-4 shadow-sm',
                esCancelado
                    ? 'border-red-500/60 dark:border-red-700/60 bg-red-50/50 dark:bg-red-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
            )}
            aria-label={`Pedido ${pedido.idPedido}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0 flex-1">
                    <div
                        className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-400/25 flex items-center justify-center shadow-sm"
                        aria-hidden
                    >
                        <img
                            src="/mesa cocineros icon.png"
                            alt=""
                            className="h-7 w-7 sm:h-8 sm:w-8 object-contain dark:invert"
                            draggable={false}
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Pedido
                        </div>
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-50 tabular-nums">
                            #{pedido.idPedido}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
                            {formatMesa(pedido.mesa)}
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                            {formatTime(pedido.creado_en)} · {lineas} línea{lineas !== 1 ? 's' : ''} · {unidades}{' '}
                            u.
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto sm:min-w-[140px]">
                    <button
                        type="button"
                        onClick={() => onVerDetalle(pedido)}
                        className={classNames(
                            'rounded-xl border px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                            esCancelado
                                ? 'border-red-600 bg-red-600 text-white hover:bg-red-500 dark:border-red-500 dark:bg-red-700 dark:hover:bg-red-600'
                                : tieneNotasMesero
                                  ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-950 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800',
                        )}
                    >
                        Ver detalles
                        {esCancelado ? (
                            <img
                                src="/advertencia icon.png"
                                alt=""
                                className="inline-block ml-1.5 h-4 w-4 align-[-2px] dark:invert"
                                aria-hidden
                            />
                        ) : tieneNotasMesero ? (
                            <img
                                src="/advertencia.png"
                                alt=""
                                className="inline-block ml-1.5 h-4 w-4 align-[-2px] opacity-90"
                                aria-hidden
                            />
                        ) : null}
                    </button>
                    {esCancelado ? (
                        <span className="text-center text-xs font-semibold text-red-700 dark:text-red-300 py-2 px-1 line-clamp-2">
                            {pedido.motivo_cancelacion || 'Pedido cancelado por el mesero'}
                        </span>
                    ) : action ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onAdvance(pedido.idPedido, action.next)}
                            className={classNames(
                                'rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500',
                                action.className,
                            )}
                        >
                            {busy ? 'Guardando…' : action.label}
                        </button>
                    ) : (
                        <span className="text-center text-xs text-stone-500 dark:text-stone-400 py-2">
                            Esperando mesero
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}

function PlatoDetalleCard({ linea }) {
    const p = linea.producto;
    const tieneNota = Boolean(linea.nota?.trim());

    return (
        <article className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-hidden">
            <div className="flex gap-0 sm:gap-4 flex-col sm:flex-row">
                <div className="aspect-[4/3] sm:w-36 sm:aspect-square shrink-0 bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden">
                    {p?.imagenUrl ? (
                        <img src={p.imagenUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                        <span className="text-2xl font-bold text-stone-400 dark:text-stone-600">
                            {p?.nombreProducto?.slice(0, 2)?.toUpperCase() ?? '?'}
                        </span>
                    )}
                </div>
                <div className="p-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="font-semibold text-stone-900 dark:text-stone-50">
                            <span className="text-amber-700 dark:text-amber-400 tabular-nums">{linea.cantidad}×</span>{' '}
                            {p?.nombreProducto ?? 'Producto'}
                        </h4>
                        {p?.tipo ? (
                            <span className="text-[10px] uppercase font-semibold text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5">
                                {p.tipo}
                            </span>
                        ) : null}
                    </div>
                    {p?.descripcion ? (
                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-snug">{p.descripcion}</p>
                    ) : (
                        <p className="mt-2 text-sm text-stone-500 dark:text-stone-500 italic">Sin descripción del plato.</p>
                    )}
                    {tieneNota ? (
                        <div className="mt-3 rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                                <img src="/advertencia.png" alt="" className="h-4 w-4 shrink-0" />
                                Descripción del mesero
                            </div>
                            <p className="mt-1 text-sm text-amber-950 dark:text-amber-100/90">{linea.nota}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function ModalAlertasCancelados({ pedidos, onClose, onVerDetalle, onMarcarVistos }) {
    if (!pedidos) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="alertas-cancelados-titulo"
                className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-red-300 dark:border-red-800 bg-white dark:bg-stone-900 shadow-2xl"
            >
                <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
                    <div className="flex gap-3 min-w-0">
                        <img src="/advertencia icon.png" alt="" className="h-8 w-8 shrink-0 dark:invert" />
                        <div>
                            <h2 id="alertas-cancelados-titulo" className="text-lg font-semibold text-red-900 dark:text-red-100">
                                Pedidos cancelados
                            </h2>
                            <p className="text-sm text-red-800/80 dark:text-red-200/80">
                                Deja de preparar estos platos. Revisa el motivo del mesero.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm shrink-0"
                    >
                        Cerrar
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {pedidos.length === 0 ? (
                        <p className="text-sm text-center text-stone-600 dark:text-stone-400 py-8">
                            No hay cancelaciones recientes.
                        </p>
                    ) : (
                        pedidos.map((p) => (
                            <button
                                key={p.idPedido}
                                type="button"
                                onClick={() => {
                                    onMarcarVistos([p.idPedido]);
                                    onVerDetalle(p);
                                }}
                                className="w-full text-left rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                            >
                                <div className="flex justify-between gap-2">
                                    <span className="font-bold text-red-900 dark:text-red-100">Pedido #{p.idPedido}</span>
                                    <span className="text-xs text-red-700 dark:text-red-300 tabular-nums">
                                        {formatTime(p.cancelado_en || p.actualizado_en)}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mt-1">
                                    {formatMesa(p.mesa)}
                                </p>
                                <p className="text-sm text-red-800 dark:text-red-200 mt-2 line-clamp-3">
                                    {p.motivo_cancelacion || 'Sin motivo registrado'}
                                </p>
                            </button>
                        ))
                    )}
                </div>
                {pedidos.length > 0 ? (
                    <div className="shrink-0 p-4 border-t border-stone-200 dark:border-stone-800">
                        <button
                            type="button"
                            onClick={() => {
                                onMarcarVistos(pedidos.map((p) => p.idPedido));
                                onClose();
                            }}
                            className="w-full rounded-xl bg-stone-800 dark:bg-stone-700 text-stone-50 py-2.5 text-sm font-medium"
                        >
                            Marcar todos como vistos
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ModalDetallePedido({ pedido, onClose }) {
    if (!pedido) return null;

    const tieneNotas = (pedido.detalles ?? []).some((l) => l.nota?.trim());
    const esCancelado = pedido.estado === 'CANCELADO';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalle-pedido-titulo"
                className="relative z-10 w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl"
            >
                <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-stone-200 dark:border-stone-800">
                    <div>
                        <h2 id="detalle-pedido-titulo" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                            Pedido #{pedido.idPedido}
                        </h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {formatMesa(pedido.mesa)} · {formatTime(pedido.creado_en)}
                        </p>
                        {pedido.mesero?.nombre ? (
                            <p className="text-xs text-stone-500 mt-1">Mesero: {pedido.mesero.nombre}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {esCancelado ? (
                        <div className="rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-800 dark:text-red-200">
                                <img src="/advertencia icon.png" alt="" className="h-5 w-5 dark:invert" />
                                Pedido cancelado por el mesero
                            </div>
                            <p className="mt-2 text-sm text-red-950 dark:text-red-100 leading-snug">
                                {pedido.motivo_cancelacion || 'No se indicó motivo.'}
                            </p>
                            {pedido.cancelado_en ? (
                                <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                                    Cancelado a las {formatTime(pedido.cancelado_en)}
                                </p>
                            ) : null}
                            <p className="mt-2 text-xs font-medium text-red-800 dark:text-red-300">
                                No prepares más platos de este pedido.
                            </p>
                        </div>
                    ) : null}
                    {pedido.notas ? (
                        <p className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                            Nota de mesa: {pedido.notas}
                        </p>
                    ) : null}
                    {tieneNotas ? (
                        <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                            <img src="/advertencia.png" alt="" className="h-4 w-4" />
                            Hay indicaciones del mesero en uno o más platos.
                        </p>
                    ) : null}
                    {(pedido.detalles ?? []).map((l) => (
                        <PlatoDetalleCard key={l.idPedidoDetalle} linea={l} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function CocinaPedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [pedidosCancelados, setPedidosCancelados] = useState([]);
    const [canceladosVistos, setCanceladosVistos] = useState(() => leerCanceladosVistos());
    const [loadError, setLoadError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [tabActiva, setTabActiva] = useState('PENDIENTE');
    const [sortBy, setSortBy] = useState('fecha_asc');
    const [pagina, setPagina] = useState(1);
    const [detallePedido, setDetallePedido] = useState(null);
    const [modalAlertasAbierto, setModalAlertasAbierto] = useState(false);

    const marcarCanceladosVistos = useCallback((ids) => {
        if (!ids?.length) return;
        setCanceladosVistos((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.add(Number(id));
            guardarCanceladosVistos(next);
            return next;
        });
    }, []);

    const fetchPedidos = useCallback(async () => {
        try {
            const res = await apiFetch('/api/cocina/pedidos');
            const cancelados = Array.isArray(res?.cancelados) ? res.cancelados : [];
            setPedidos(Array.isArray(res?.data) ? res.data : []);
            setPedidosCancelados(cancelados);
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

    const alertasSinLeer = useMemo(
        () => pedidosCancelados.filter((p) => !canceladosVistos.has(p.idPedido)).length,
        [pedidosCancelados, canceladosVistos],
    );

    const conteos = useMemo(() => {
        const c = { PENDIENTE: 0, EN_PREPARACION: 0, LISTO: 0, CANCELADO: pedidosCancelados.length };
        for (const p of pedidos) {
            if (c[p.estado] != null) c[p.estado]++;
        }
        return c;
    }, [pedidos, pedidosCancelados.length]);

    const pedidosTab = useMemo(() => {
        if (tabActiva === 'CANCELADO') {
            return sortPedidos(pedidosCancelados, sortBy);
        }
        return sortPedidos(
            pedidos.filter((p) => p.estado === tabActiva),
            sortBy,
        );
    }, [pedidos, pedidosCancelados, tabActiva, sortBy]);

    function abrirDetalle(pedido) {
        if (pedido?.estado === 'CANCELADO') {
            marcarCanceladosVistos([pedido.idPedido]);
        }
        setDetallePedido(pedido);
    }

    function abrirAlertas() {
        setModalAlertasAbierto(true);
    }

    const totalPaginas = Math.max(1, Math.ceil(pedidosTab.length / PAGE_SIZE));

    const pedidosPagina = useMemo(() => {
        const start = (pagina - 1) * PAGE_SIZE;
        return pedidosTab.slice(start, start + PAGE_SIZE);
    }, [pedidosTab, pagina]);

    useEffect(() => {
        setPagina(1);
    }, [tabActiva, sortBy]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    async function onAdvance(idPedido, estado) {
        setBusyId(idPedido);
        try {
            await apiFetch(`/api/cocina/pedidos/${idPedido}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado }),
            });
            await fetchPedidos();
            if (estado === 'EN_PREPARACION') setTabActiva('EN_PREPARACION');
            if (estado === 'LISTO') setTabActiva('LISTO');
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
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                            Cocina
                        </h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Cola por estado · actualización cada 6 s</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={abrirAlertas}
                            aria-label={
                                alertasSinLeer > 0
                                    ? `${alertasSinLeer} pedidos cancelados sin leer`
                                    : 'Ver pedidos cancelados'
                            }
                            className="relative rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                            <img src="/advertencia icon.png" alt="" className="h-5 w-5 dark:invert" />
                            {alertasSinLeer > 0 ? (
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-stone-50 dark:ring-stone-950">
                                    {alertasSinLeer > 9 ? '9+' : alertasSinLeer}
                                </span>
                            ) : pedidosCancelados.length > 0 ? (
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-stone-50 dark:ring-stone-950" />
                            ) : null}
                        </button>
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => fetchPedidos()}
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                            Actualizar
                        </button>
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm text-stone-600 dark:text-stone-400"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
                {loadError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                        {loadError}
                    </div>
                ) : null}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {SEMAFORO.map((s) => {
                        const activo = tabActiva === s.key;
                        const count = conteos[s.key] ?? 0;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setTabActiva(s.key)}
                                className={classNames(
                                    'rounded-xl border-2 p-3 sm:p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation',
                                    activo
                                        ? s.activeTab
                                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600',
                                )}
                            >
                                <span
                                    className={classNames(
                                        'inline-block h-3 w-3 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 mb-2',
                                        s.dotClass,
                                    )}
                                    aria-hidden
                                />
                                <div className="text-xs sm:text-sm font-semibold leading-tight">{s.label}</div>
                                <div className="text-lg sm:text-2xl font-bold tabular-nums mt-1">{count}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                        <span className="font-medium text-stone-800 dark:text-stone-200">Ordenar</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <p className="text-sm text-stone-600 dark:text-stone-400 tabular-nums">
                        {pedidosTab.length} pedido{pedidosTab.length !== 1 ? 's' : ''}
                        {pedidosTab.length > PAGE_SIZE
                            ? ` · página ${pagina} de ${totalPaginas}`
                            : ''}
                    </p>
                </div>

                <div className="space-y-3 min-h-[120px]">
                    {pedidosPagina.length === 0 ? (
                        <p className="text-center text-sm text-stone-600 dark:text-stone-500 py-12 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                            No hay pedidos en esta columna.
                        </p>
                    ) : (
                        pedidosPagina.map((p) => (
                            <PedidoResumenCard
                                key={p.idPedido}
                                pedido={p}
                                onAdvance={onAdvance}
                                onVerDetalle={abrirDetalle}
                                busyId={busyId}
                            />
                        ))
                    )}
                </div>

                {pedidosTab.length > PAGE_SIZE ? (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            disabled={pagina <= 1}
                            onClick={() => setPagina((n) => Math.max(1, n - 1))}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Anterior
                        </button>
                        <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400">
                            {pagina} / {totalPaginas}
                        </span>
                        <button
                            type="button"
                            disabled={pagina >= totalPaginas}
                            onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Siguiente
                        </button>
                    </div>
                ) : null}

                <p className="text-center text-sm text-stone-600 dark:text-stone-500 pt-4">
                    <Link to="/cliente" className="hover:text-stone-800 dark:hover:text-stone-300">
                        Sitio para clientes
                    </Link>
                </p>
            </div>

            <ModalDetallePedido pedido={detallePedido} onClose={() => setDetallePedido(null)} />
            {modalAlertasAbierto ? (
                <ModalAlertasCancelados
                    pedidos={pedidosCancelados}
                    onClose={() => setModalAlertasAbierto(false)}
                    onVerDetalle={(p) => {
                        setModalAlertasAbierto(false);
                        abrirDetalle(p);
                    }}
                    onMarcarVistos={marcarCanceladosVistos}
                />
            ) : null}
        </div>
    );
}
