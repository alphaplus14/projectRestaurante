import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function formatMoney(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
        Number(n),
    );
}

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function IconChefHat({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M4 17h16" />
            <path d="M7 17v-1.5C7 12 9.5 9 12 9s5 3 5 6.5V17" />
            <path d="M8.5 10.5c.7-1.8 2.3-3 3.5-3s2.8 1.2 3.5 3" />
        </svg>
    );
}

function normalizarBusqueda(s) {
    return String(s ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

const ESTADO_LABEL = {
    PENDIENTE: 'Enviado a cocina',
    EN_PREPARACION: 'En preparación',
    LISTO: 'Listo',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
};

function formatHora(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return null;
    }
}

function tituloReferenciaPedido(active) {
    if (!active?.idPedido) return null;
    const n = active.notas_mesa?.trim?.() || active.notas?.trim?.();
    if (n) return n.length > 52 ? `${n.slice(0, 49)}…` : n;
    return `Pedido #${active.idPedido}`;
}

function ProductThumb({ imagenUrl, nombre, className }) {
    return (
        <div
            className={classNames(
                'aspect-[4/3] w-full overflow-hidden bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400',
                className,
            )}
        >
            {imagenUrl ? (
                <img src={imagenUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
                <span className="text-2xl font-bold opacity-60">{nombre?.slice(0, 2)?.toUpperCase() ?? '?'}</span>
            )}
        </div>
    );
}

function MesaCard({ mesa, onSelect }) {
    const active = mesa.pedido_activo;
    const bloqueado = active?.bloqueado;
    const ocupada = mesa.estado === 'OCUPADA';
    const hora = active?.creado_en ? formatHora(active.creado_en) : null;
    const estadoPedido = active?.estado ? ESTADO_LABEL[active.estado] || active.estado : null;
    const refTitulo = active && !bloqueado ? tituloReferenciaPedido(active) : null;

    return (
        <button
            type="button"
            onClick={() => onSelect(mesa.idMesa)}
            className={classNames(
                'rounded-2xl border p-4 sm:p-5 text-left transition-all min-h-[120px] active:scale-[0.98] touch-manipulation shadow-sm w-full',
                'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500/50 hover:shadow-md',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Mesa {mesa.numero}
                    </div>
                    <div className="mt-0.5 text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 leading-snug truncate">
                        {mesa.nombre || `Mesa ${mesa.numero}`}
                    </div>
                </div>
                <span className="shrink-0 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-[10px] font-medium text-stone-600 dark:text-stone-400">
                    {mesa.capacidad ?? '—'} pers.
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                    className={classNames(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        bloqueado
                            ? 'bg-stone-200 text-stone-700 border border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600'
                            : ocupada
                              ? 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/60'
                              : 'bg-stone-100 text-stone-700 border border-stone-300 dark:bg-stone-800/90 dark:text-stone-300 dark:border-stone-600',
                    )}
                >
                    {bloqueado ? 'Otro mesero' : ocupada ? 'Ocupada' : 'Libre'}
                </span>
                {active && estadoPedido ? (
                    <span className="text-[11px] text-stone-600 dark:text-stone-400 truncate">
                        {estadoPedido}
                        {hora ? ` · ${hora}` : ''}
                    </span>
                ) : null}
            </div>

            {bloqueado ? (
                <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                    {active?.mensaje || 'Cuenta de otro compañero.'}
                </p>
            ) : active?.idPedido ? (
                <div className="mt-2 space-y-0.5">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate">{refTitulo}</p>
                    {active.resumen_productos ? (
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1">
                            {active.resumen_productos}
                        </p>
                    ) : null}
                    {active.subtotal_cop > 0 ? (
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 tabular-nums mt-1">
                            {formatMoney(active.subtotal_cop)}
                        </p>
                    ) : null}
                </div>
            ) : (
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Toca para abrir o tomar pedido</p>
            )}
        </button>
    );
}

function ProductMenuCard({ producto, qty, nota, adding, onQty, onNota, onAdd }) {
    const [showNota, setShowNota] = useState(false);

    return (
        <article className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden flex flex-col shadow-sm">
            <ProductThumb imagenUrl={producto.imagenUrl} nombre={producto.nombreProducto} />
            <div className="p-3 flex flex-col flex-1 gap-2">
                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-50 text-sm leading-snug line-clamp-2">
                        {producto.nombreProducto}
                    </h4>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">
                        {formatMoney(producto.precio)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`q-${producto.idProducto}`}>
                        Cantidad
                    </label>
                    <input
                        id={`q-${producto.idProducto}`}
                        type="number"
                        min={1}
                        max={99}
                        className="w-14 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-2 py-2 text-sm text-stone-900 dark:text-stone-50 tabular-nums focus-visible:ring-2 focus-visible:ring-amber-500"
                        value={qty}
                        onChange={(e) => onQty(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNota((v) => !v)}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-2 py-2 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                        aria-expanded={showNota}
                    >
                        Nota
                    </button>
                    <button
                        type="button"
                        disabled={adding}
                        onClick={onAdd}
                        className="flex-1 rounded-lg bg-orange-700 hover:bg-orange-600 text-stone-50 text-sm font-semibold py-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation"
                    >
                        {adding ? '…' : '+'}
                    </button>
                </div>
                {showNota ? (
                    <input
                        type="text"
                        placeholder="Ej. sin cebolla"
                        value={nota}
                        onChange={(e) => onNota(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-2 py-1.5 text-xs text-stone-900 dark:text-stone-50 placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-amber-500"
                    />
                ) : null}
            </div>
        </article>
    );
}

export function MeseroSalonPage() {
    const [mesas, setMesas] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [mesaTab, setMesaTab] = useState('cuenta');
    const [pedido, setPedido] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [categoriaActiva, setCategoriaActiva] = useState(null);
    const [busquedaMenu, setBusquedaMenu] = useState('');
    const [busquedaAplicada, setBusquedaAplicada] = useState('');
    const [banner, setBanner] = useState('');
    const [loadingMesas, setLoadingMesas] = useState(true);
    const [loadingPedido, setLoadingPedido] = useState(false);
    const [loadingCategorias, setLoadingCategorias] = useState(false);
    const [loadingCatalogo, setLoadingCatalogo] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [cerrando, setCerrando] = useState(false);
    const [qtyByProduct, setQtyByProduct] = useState({});
    const [notaByProduct, setNotaByProduct] = useState({});

    const selectedMesa = useMemo(() => mesas.find((m) => m.idMesa === selectedId), [mesas, selectedId]);

    const fetchMesas = useCallback(async () => {
        try {
            const res = await apiFetch('/api/mesero/mesas');
            setMesas(Array.isArray(res?.data) ? res.data : []);
            setBanner('');
        } catch (e) {
            setBanner(e?.message || 'No se pudieron cargar las mesas.');
        } finally {
            setLoadingMesas(false);
        }
    }, []);

    const fetchCategorias = useCallback(async () => {
        setLoadingCategorias(true);
        try {
            const res = await apiFetch('/api/mesero/categorias');
            setCategorias(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            setBanner(e?.message || 'No se pudieron cargar las categorías.');
        } finally {
            setLoadingCategorias(false);
        }
    }, []);

    const fetchProductos = useCallback(async ({ categoriaId, q }) => {
        setLoadingCatalogo(true);
        setCatalogo([]);
        try {
            const params = new URLSearchParams();
            if (categoriaId) params.set('categoria_id', String(categoriaId));
            if (q?.trim()) params.set('q', q.trim());
            const res = await apiFetch(`/api/mesero/productos?${params}`);
            setCatalogo(Array.isArray(res?.data) ? res.data : []);
            setBanner('');
        } catch (e) {
            setBanner(e?.message || 'No se pudieron cargar los productos.');
            setCatalogo([]);
        } finally {
            setLoadingCatalogo(false);
        }
    }, []);

    const loadPedido = useCallback(async (idPedido) => {
        setLoadingPedido(true);
        try {
            const res = await apiFetch(`/api/mesero/pedidos/${idPedido}`);
            setPedido(res?.data ?? null);
            setBanner('');
        } catch (e) {
            setPedido(null);
            setBanner(e?.message || 'No se pudo cargar el pedido.');
        } finally {
            setLoadingPedido(false);
        }
    }, []);

    useEffect(() => {
        fetchMesas();
    }, [fetchMesas]);

    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') fetchMesas();
        }, 8000);
        return () => clearInterval(id);
    }, [fetchMesas]);

    useEffect(() => {
        if (!selectedId) {
            setPedido(null);
            return;
        }
        const snap = mesas.find((m) => m.idMesa === selectedId);
        if (snap?.pedido_activo?.bloqueado) {
            setPedido(null);
            return;
        }
        if (snap?.pedido_activo?.idPedido) {
            void loadPedido(snap.pedido_activo.idPedido);
        } else {
            setPedido(null);
        }
    }, [selectedId, mesas, loadPedido]);

    useEffect(() => {
        if (selectedId && mesaTab === 'menu' && categorias.length === 0 && !loadingCategorias) {
            void fetchCategorias();
        }
    }, [selectedId, mesaTab, categorias.length, loadingCategorias, fetchCategorias]);

    useEffect(() => {
        if (!selectedId) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedId]);

    function resetMenuFiltros() {
        setCategoriaActiva(null);
        setBusquedaMenu('');
        setBusquedaAplicada('');
        setCatalogo([]);
    }

    function cerrarMesa() {
        setSelectedId(null);
        setMesaTab('cuenta');
        resetMenuFiltros();
        setCategorias([]);
        setPedido(null);
    }

    function seleccionarCategoria(idCategoria) {
        setCategoriaActiva(idCategoria);
        setBusquedaMenu('');
        setBusquedaAplicada('');
        void fetchProductos({ categoriaId: idCategoria });
    }

    function ejecutarBusqueda(e) {
        e?.preventDefault?.();
        const term = busquedaMenu.trim();
        if (term.length < 2) {
            setBanner('Escribe al menos 2 letras para buscar.');
            return;
        }
        setCategoriaActiva(null);
        setBusquedaAplicada(term);
        void fetchProductos({ q: term });
    }

    async function abrirCuenta() {
        if (!selectedId) return;
        setBanner('');
        try {
            const res = await apiFetch('/api/mesero/pedidos', {
                method: 'POST',
                body: JSON.stringify({ mesa_idMesa: selectedId }),
            });
            const p = res?.data;
            if (p?.idPedido) {
                setPedido(p);
                setMesaTab('menu');
                await fetchMesas();
            }
        } catch (e) {
            setBanner(e?.message || 'No se pudo abrir la cuenta.');
        }
    }

    async function agregarProducto(idProducto) {
        if (!pedido?.idPedido) return;
        const qty = Math.min(99, Math.max(1, Number(qtyByProduct[idProducto]) || 1));
        const nota = notaByProduct[idProducto]?.trim() || null;
        setAddingId(idProducto);
        setBanner('');
        try {
            await apiFetch(`/api/mesero/pedidos/${pedido.idPedido}/detalles`, {
                method: 'POST',
                body: JSON.stringify({
                    producto_idProducto: idProducto,
                    cantidad: qty,
                    nota,
                }),
            });
            await loadPedido(pedido.idPedido);
            await fetchMesas();
            setQtyByProduct((prev) => ({ ...prev, [idProducto]: 1 }));
            setNotaByProduct((prev) => ({ ...prev, [idProducto]: '' }));
        } catch (e) {
            setBanner(e?.message || 'No se pudo agregar el producto.');
        } finally {
            setAddingId(null);
        }
    }

    async function cerrarCuenta() {
        if (!pedido?.idPedido || pedido.estado !== 'LISTO') return;
        if (!window.confirm('¿Cerrar la cuenta? La mesa quedará libre para un nuevo servicio.')) return;
        setCerrando(true);
        setBanner('');
        try {
            const res = await apiFetch(`/api/mesero/pedidos/${pedido.idPedido}/cerrar`, {
                method: 'POST',
            });
            setPedido(null);
            setBanner(res?.message || 'Cuenta cerrada.');
            await fetchMesas();
            cerrarMesa();
        } catch (e) {
            setBanner(e?.message || 'No se pudo cerrar la cuenta.');
        } finally {
            setCerrando(false);
        }
    }

    function onSalir() {
        clearToken();
        window.location.href = '/login-mesero';
    }

    const nombreCategoriaActiva = useMemo(
        () => categorias.find((c) => c.idCategoria === categoriaActiva)?.nombre ?? null,
        [categorias, categoriaActiva],
    );

    const totalPedido = useMemo(() => {
        if (!pedido?.detalles?.length) return 0;
        return pedido.detalles.reduce((s, l) => s + Number(l.precio_unitario) * Number(l.cantidad), 0);
    }, [pedido]);

    const puedeAgregar = pedido && !['LISTO', 'CERRADO', 'CANCELADO'].includes(pedido.estado);
    const menuSinSeleccion = !categoriaActiva && !busquedaAplicada && !loadingCatalogo;
    const bloqueado = selectedMesa?.pedido_activo?.bloqueado;

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-5xl px-3 sm:px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 truncate">
                            Salón — mesero
                        </h1>
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-500 truncate">
                            Elige una mesa para ver la cuenta o agregar platos
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => fetchMesas()}
                            className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Actualizar
                        </button>
                        <Link
                            to="/login-cocina"
                            aria-label="Cambiar a pantalla de cocina"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors"
                        >
                            <IconChefHat className="h-4 w-4 shrink-0 opacity-90" />
                            <span className="whitespace-nowrap hidden sm:inline">Cocina</span>
                        </Link>
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-lg border border-stone-200 dark:border-stone-800 px-3 sm:px-4 py-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-8">
                {banner && !selectedId ? (
                    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-100 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        {banner}
                    </div>
                ) : null}

                <div className="flex items-end justify-between gap-2 mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50">Mesas</h2>
                    <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">{mesas.length} activas</span>
                </div>

                {loadingMesas ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-32 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-200/60 dark:bg-stone-900/80 animate-pulse"
                            />
                        ))}
                    </div>
                ) : mesas.length === 0 ? (
                    <p className="text-sm text-stone-600 dark:text-stone-400 text-center py-12">No hay mesas activas.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {mesas.map((m) => (
                            <MesaCard key={m.idMesa} mesa={m} onSelect={setSelectedId} />
                        ))}
                    </div>
                )}
            </main>

            {selectedId && selectedMesa ? (
                <div
                    className="fixed inset-0 z-40 flex flex-col bg-stone-100 dark:bg-stone-950"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mesa-modal-title"
                >
                    <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur safe-area-inset-top">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 max-w-3xl mx-auto w-full">
                            <button
                                type="button"
                                onClick={cerrarMesa}
                                className="shrink-0 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation"
                                aria-label="Volver al salón"
                            >
                                <span className="text-lg leading-none" aria-hidden>
                                    ←
                                </span>
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                                    Mesa {selectedMesa.numero}
                                </p>
                                <h2
                                    id="mesa-modal-title"
                                    className="text-lg font-bold text-stone-900 dark:text-stone-50 truncate"
                                >
                                    {selectedMesa.nombre || `Mesa ${selectedMesa.numero}`}
                                </h2>
                            </div>
                        </div>

                        <div className="flex gap-1 px-3 sm:px-4 pb-3 max-w-3xl mx-auto w-full">
                            <div className="flex gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setMesaTab('cuenta')}
                                    className={classNames(
                                        'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-500',
                                        mesaTab === 'cuenta'
                                            ? 'bg-orange-700 text-stone-50'
                                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60',
                                    )}
                                >
                                    Cuenta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMesaTab('menu')}
                                    disabled={bloqueado || !puedeAgregar}
                                    className={classNames(
                                        'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed',
                                        mesaTab === 'menu'
                                            ? 'bg-orange-700 text-stone-50'
                                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60',
                                    )}
                                >
                                    Menú
                                </button>
                            </div>
                        </div>
                    </div>

                    {banner ? (
                        <div className="shrink-0 mx-3 sm:mx-4 mt-2 max-w-3xl w-full self-center rounded-lg border border-amber-500/30 bg-amber-100 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                            {banner}
                        </div>
                    ) : null}

                    <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full pb-[max(1rem,env(safe-area-inset-bottom))]">
                        {mesaTab === 'cuenta' ? (
                            <div className="space-y-4">
                                {bloqueado ? (
                                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-sm text-stone-600 dark:text-stone-400">
                                        {selectedMesa.pedido_activo?.mensaje || 'Esta mesa la atiende otro mesero.'}
                                    </div>
                                ) : loadingPedido ? (
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
                                        <div className="h-24 rounded-xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
                                    </div>
                                ) : pedido ? (
                                    <>
                                        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-amber-700 dark:text-amber-400">
                                                    {tituloReferenciaPedido({
                                                        idPedido: pedido.idPedido,
                                                        notas_mesa: pedido.notas,
                                                        notas: pedido.notas,
                                                    })}
                                                </span>
                                                <span className="rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 px-2.5 py-0.5 text-xs text-stone-700 dark:text-stone-200">
                                                    {ESTADO_LABEL[pedido.estado] || pedido.estado}
                                                </span>
                                                <span className="text-sm font-semibold tabular-nums text-stone-800 dark:text-stone-200 sm:ml-auto">
                                                    {formatMoney(totalPedido)}
                                                </span>
                                            </div>
                                            {pedido.notas ? (
                                                <p className="mt-3 text-sm text-stone-700 dark:text-stone-300 rounded-lg bg-stone-50 dark:bg-stone-950 px-3 py-2 border border-stone-200 dark:border-stone-800">
                                                    Nota: {pedido.notas}
                                                </p>
                                            ) : null}
                                        </div>

                                        <ul className="divide-y divide-stone-200 dark:divide-stone-800 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
                                            {pedido.detalles?.length ? (
                                                pedido.detalles.map((l) => (
                                                    <li
                                                        key={l.idPedidoDetalle}
                                                        className="px-4 py-3 flex gap-3 text-sm"
                                                    >
                                                        <span className="font-semibold text-amber-600 dark:text-amber-500 tabular-nums w-8 shrink-0">
                                                            {l.cantidad}×
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-stone-900 dark:text-stone-50">
                                                                {l.producto?.nombreProducto}
                                                            </div>
                                                            {l.nota ? (
                                                                <div className="text-xs text-stone-600 dark:text-stone-500">
                                                                    {l.nota}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <span className="text-stone-600 dark:text-stone-400 tabular-nums shrink-0">
                                                            {formatMoney(
                                                                Number(l.precio_unitario) * Number(l.cantidad),
                                                            )}
                                                        </span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-8 text-center text-stone-600 dark:text-stone-500 text-sm">
                                                    Sin ítems. Ve a la pestaña Menú para agregar.
                                                </li>
                                            )}
                                        </ul>

                                        {puedeAgregar ? (
                                            <button
                                                type="button"
                                                onClick={() => setMesaTab('menu')}
                                                className="w-full rounded-xl bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold py-3.5 text-sm focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation"
                                            >
                                                Agregar platos al pedido
                                            </button>
                                        ) : null}

                                        {pedido.estado === 'LISTO' ? (
                                            <button
                                                type="button"
                                                disabled={cerrando}
                                                onClick={cerrarCuenta}
                                                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-3 text-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                                            >
                                                {cerrando ? 'Cerrando…' : 'Cerrar cuenta y liberar mesa'}
                                            </button>
                                        ) : ['CERRADO', 'CANCELADO'].includes(pedido.estado) ? (
                                            <p className="text-xs text-center text-stone-600 dark:text-stone-500">
                                                Pedido finalizado.
                                            </p>
                                        ) : null}
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-center space-y-4">
                                        <p className="text-sm text-stone-600 dark:text-stone-400">
                                            No hay pedido abierto en esta mesa.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={abrirCuenta}
                                            className="w-full max-w-xs mx-auto rounded-xl bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold py-3.5 text-sm focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation"
                                        >
                                            Abrir cuenta
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {!puedeAgregar ? (
                                    <p className="text-sm text-stone-600 dark:text-stone-400 text-center py-8">
                                        {bloqueado
                                            ? 'No puedes tomar pedidos en esta mesa.'
                                            : 'Abre la cuenta primero en la pestaña Cuenta.'}
                                    </p>
                                ) : (
                                    <>
                                        <form onSubmit={ejecutarBusqueda} className="flex gap-2">
                                            <div className="relative flex-1 min-w-0">
                                                <span
                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
                                                    aria-hidden
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <circle cx="11" cy="11" r="7" />
                                                        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="search"
                                                    enterKeyHint="search"
                                                    autoComplete="off"
                                                    value={busquedaMenu}
                                                    onChange={(e) => setBusquedaMenu(e.target.value)}
                                                    placeholder="Buscar por nombre…"
                                                    className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-3 pl-10 pr-3 text-sm text-stone-900 dark:text-stone-50 placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-amber-500"
                                                    aria-label="Buscar en el menú"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="shrink-0 rounded-xl bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation"
                                            >
                                                Buscar
                                            </button>
                                        </form>

                                        <div>
                                            <p className="text-xs font-medium text-stone-600 dark:text-stone-500 mb-2">
                                                Categorías
                                            </p>
                                            {loadingCategorias ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div
                                                            key={i}
                                                            className="h-10 w-24 rounded-xl bg-stone-200 dark:bg-stone-800 animate-pulse"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {categorias.map((cat) => (
                                                        <button
                                                            key={cat.idCategoria}
                                                            type="button"
                                                            onClick={() => seleccionarCategoria(cat.idCategoria)}
                                                            className={classNames(
                                                                'rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-amber-500',
                                                                categoriaActiva === cat.idCategoria
                                                                    ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                                                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-amber-500/40',
                                                            )}
                                                        >
                                                            {cat.nombre}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {menuSinSeleccion && !loadingCatalogo ? (
                                            <p className="text-sm text-center text-stone-600 dark:text-stone-500 py-10 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                                                Elige una categoría o busca un plato por nombre.
                                            </p>
                                        ) : null}

                                        {loadingCatalogo ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-pulse"
                                                    >
                                                        <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800" />
                                                        <div className="h-20 bg-stone-100 dark:bg-stone-900" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}

                                        {!loadingCatalogo && (categoriaActiva || busquedaAplicada) ? (
                                            <>
                                                <p className="text-xs text-stone-600 dark:text-stone-500">
                                                    {busquedaAplicada
                                                        ? `${catalogo.length} resultado${catalogo.length !== 1 ? 's' : ''} para «${busquedaAplicada}»`
                                                        : nombreCategoriaActiva
                                                          ? `${catalogo.length} en ${nombreCategoriaActiva}`
                                                          : null}
                                                </p>
                                                {catalogo.length === 0 ? (
                                                    <p className="text-sm text-center text-stone-600 dark:text-stone-500 py-8">
                                                        No hay productos en esta selección.
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {catalogo.map((p) => (
                                                            <ProductMenuCard
                                                                key={p.idProducto}
                                                                producto={p}
                                                                qty={qtyByProduct[p.idProducto] ?? 1}
                                                                nota={notaByProduct[p.idProducto] ?? ''}
                                                                adding={addingId === p.idProducto}
                                                                onQty={(v) =>
                                                                    setQtyByProduct((prev) => ({
                                                                        ...prev,
                                                                        [p.idProducto]: v,
                                                                    }))
                                                                }
                                                                onNota={(v) =>
                                                                    setNotaByProduct((prev) => ({
                                                                        ...prev,
                                                                        [p.idProducto]: v,
                                                                    }))
                                                                }
                                                                onAdd={() => agregarProducto(p.idProducto)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
