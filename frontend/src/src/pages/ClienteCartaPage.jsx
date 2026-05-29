import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken, getToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? '');
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function tipoLabel(tipo) {
    if (tipo === 'BEBIDA') return 'Bebida';
    if (tipo === 'COMBO') return 'Combo';
    return 'Plato';
}

const CARTA_FILTROS = [
    { id: 'platos-fuertes', label: 'Platos fuertes', icon: '/platos fuertes icon.png' },
    { id: 'bebidas', label: 'Bebidas', icon: '/bebidas icon+.png' },
    { id: 'postres', label: 'Postres', icon: '/postres icon.png' },
    { id: 'combos', label: 'Combos', icon: '/combos icon.png' },
];

const ITEMS_POR_PAGINA_CARTA = 6;

function categoriaCoincideFiltro(nombreCategoria, filtroId) {
    const n = (nombreCategoria || '').toLowerCase();
    if (filtroId === 'platos-fuertes') return n.includes('plato') && n.includes('fuerte');
    if (filtroId === 'bebidas') return n.includes('bebida');
    if (filtroId === 'postres') return n.includes('postre');
    if (filtroId === 'combos') return n.includes('combo');
    return false;
}

function TituloCategoriaCarta({ children }) {
    return (
        <div className="flex justify-center px-2">
            <h2
                className={classNames(
                    'text-center text-lg sm:text-xl font-semibold tracking-tight break-words max-w-full',
                    'px-6 py-2.5 sm:px-10 sm:py-3 rounded-xl sm:rounded-2xl',
                    'border-2 border-amber-500/45 dark:border-amber-400/55',
                    'bg-gradient-to-b from-amber-50 via-white to-stone-50/90',
                    'dark:from-amber-500/20 dark:via-neutral-900/80 dark:to-neutral-950/90',
                    'text-amber-950 dark:text-amber-100',
                    'shadow-md shadow-amber-500/10 dark:shadow-amber-500/5',
                    'ring-1 ring-amber-600/10 dark:ring-amber-300/15',
                )}
            >
                {children}
            </h2>
        </div>
    );
}

function ProductoCartaCard({ p }) {
    return (
        <article className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-neutral-900/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800 border-b border-stone-200 dark:border-white/10 overflow-hidden flex items-center justify-center">
                {p.imagenUrl ? (
                    <img src={p.imagenUrl} alt={p.nombreProducto} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-xs text-stone-500 dark:text-neutral-600 px-4 text-center">Sin imagen</span>
                )}
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-stone-900 dark:text-neutral-50 leading-snug min-w-0 break-words">
                        {p.nombreProducto}
                    </h3>
                    <span
                        className={classNames(
                            'shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md font-medium',
                            p.tipo === 'BEBIDA' && 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
                            p.tipo === 'COMBO' && 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
                            p.tipo !== 'BEBIDA' && p.tipo !== 'COMBO' && 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
                        )}
                    >
                        {tipoLabel(p.tipo)}
                    </span>
                </div>
                {p.descripcion ? (
                    <p className="mt-2 text-sm text-stone-600 dark:text-neutral-400 line-clamp-3">{p.descripcion}</p>
                ) : null}
                <div className="mt-3 text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                    {formatCOP(p.precio)}
                </div>
            </div>
        </article>
    );
}

function CartaCategoriaSection({ categoria, items }) {
    const [pagina, setPagina] = useState(0);

    const totalPaginas = Math.max(1, Math.ceil(items.length / ITEMS_POR_PAGINA_CARTA));
    const paginaActual = Math.min(pagina, totalPaginas - 1);

    useEffect(() => {
        setPagina(0);
    }, [categoria, items.length]);

    const itemsPagina = useMemo(() => {
        const inicio = paginaActual * ITEMS_POR_PAGINA_CARTA;
        return items.slice(inicio, inicio + ITEMS_POR_PAGINA_CARTA);
    }, [items, paginaActual]);

    const mostrarPaginacion = items.length > ITEMS_POR_PAGINA_CARTA;

    return (
        <section>
            <TituloCategoriaCarta>{categoria}</TituloCategoriaCarta>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {itemsPagina.map((p) => (
                    <ProductoCartaCard key={p.idProducto} p={p} />
                ))}
            </div>

            {mostrarPaginacion ? (
                <nav
                    className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
                    aria-label={`Paginación de ${categoria}`}
                >
                    <button
                        type="button"
                        onClick={() => setPagina((n) => Math.max(0, n - 1))}
                        disabled={paginaActual === 0}
                        className={classNames(
                            'rounded-xl border px-3 py-2 sm:px-4 text-sm font-medium transition-all touch-manipulation',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                            paginaActual === 0
                                ? 'border-stone-200 dark:border-white/10 text-stone-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                                : 'border-amber-500/40 dark:border-amber-400/45 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-500/15 active:scale-95',
                        )}
                    >
                        ← Anterior
                    </button>

                    <span className="min-w-[7rem] text-center text-sm tabular-nums text-stone-600 dark:text-neutral-400 px-2">
                        Página{' '}
                        <span className="font-semibold text-stone-900 dark:text-neutral-100">{paginaActual + 1}</span>
                        {' '}
                        de{' '}
                        <span className="font-semibold text-stone-900 dark:text-neutral-100">{totalPaginas}</span>
                    </span>

                    <button
                        type="button"
                        onClick={() => setPagina((n) => Math.min(totalPaginas - 1, n + 1))}
                        disabled={paginaActual >= totalPaginas - 1}
                        className={classNames(
                            'rounded-xl border px-3 py-2 sm:px-4 text-sm font-medium transition-all touch-manipulation',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                            paginaActual >= totalPaginas - 1
                                ? 'border-stone-200 dark:border-white/10 text-stone-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                                : 'border-amber-500/40 dark:border-amber-400/45 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-500/15 active:scale-95',
                        )}
                    >
                        Siguiente →
                    </button>
                </nav>
            ) : null}
        </section>
    );
}

function FiltroCategoriaBtn({ filtro, activo, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={classNames(
                'group flex min-w-[4.75rem] sm:min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2 rounded-2xl border px-2 py-3 sm:px-4 sm:py-4 transition-all duration-200 touch-manipulation',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-100 dark:focus-visible:ring-offset-neutral-950',
                'active:scale-[0.96]',
                activo
                    ? 'border-amber-500/60 bg-amber-400/20 dark:bg-amber-500/25 shadow-md shadow-amber-500/15 scale-[1.02]'
                    : 'border-stone-200 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 hover:border-amber-400/50 hover:bg-amber-50/80 dark:hover:bg-amber-500/10 hover:scale-[1.03] hover:shadow-md',
            )}
            aria-pressed={activo}
        >
            <span
                className={classNames(
                    'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-transform duration-200',
                    activo ? 'bg-amber-400/30 dark:bg-amber-500/35' : 'bg-stone-100 dark:bg-white/5 group-hover:scale-110',
                )}
            >
                <img
                    src={filtro.icon}
                    alt=""
                    className="h-7 w-7 sm:h-8 sm:w-8 object-contain dark:invert"
                    draggable={false}
                />
            </span>
            <span
                className={classNames(
                    'text-[10px] sm:text-xs font-semibold text-center leading-tight px-0.5',
                    activo ? 'text-amber-800 dark:text-amber-200' : 'text-stone-700 dark:text-neutral-300',
                )}
            >
                {filtro.label}
            </span>
        </button>
    );
}

export function ClienteCartaPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('platos-fuertes');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');
            try {
                const catalogoPromise = apiFetch('/api/public/productos-carta');
                let usuario = null;
                if (getToken()) {
                    try {
                        const me = await apiFetch('/api/auth/me');
                        if (me?.user?.rol === 'CLIENTE') usuario = me.user;
                    } catch (e) {
                        if (e?.status === 401) clearToken();
                    }
                }
                const catalogo = await catalogoPromise;
                if (cancelled) return;
                setUser(usuario);
                setProductos(Array.isArray(catalogo?.data) ? catalogo.data : []);
            } catch (e) {
                if (cancelled) return;
                setError(e?.message || 'No se pudo cargar la carta.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const porCategoria = useMemo(() => {
        const map = new Map();
        for (const p of productos) {
            const key = p?.categoria?.nombre || 'Sin categoría';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(p);
        }
        return Array.from(map.entries());
    }, [productos]);

    const porCategoriaVisible = useMemo(() => {
        return porCategoria.filter(([cat]) => categoriaCoincideFiltro(cat, categoriaFiltro));
    }, [porCategoria, categoriaFiltro]);

    function seleccionarFiltro(id) {
        setCategoriaFiltro(id);
    }

    function cerrarSesion() {
        clearToken();
        navigate('/cliente', { replace: true });
    }

    const nombreMostrar = user ? [user.nombre, user.apellido].filter(Boolean).join(' ') : '';

    return (
        <div className="relative min-h-screen overflow-x-clip bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),transparent_55%)]" />

            <header className="relative border-b border-stone-200/80 dark:border-white/10 bg-white/75 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-10">
                <div className="mx-auto max-w-6xl px-3 min-[375px]:px-4 sm:px-5 md:px-6 py-3 sm:py-4 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between min-[520px]:gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-stone-500 dark:text-neutral-500">Tu carta</div>
                        <div className="text-base sm:text-lg font-semibold text-stone-900 dark:text-neutral-50 break-words line-clamp-2">
                            {nombreMostrar ? `Hola, ${nombreMostrar}` : 'Menú del día'}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 min-[375px]:gap-2 sm:gap-3 w-full min-[520px]:w-auto min-[520px]:justify-end shrink-0 touch-manipulation">
                        <ThemeToggle />
                        <Link
                            to={nombreMostrar ? '/cliente/reservas' : '/cliente/login'}
                            className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-teal-500/35 text-teal-800 dark:text-teal-300 hover:bg-teal-500/10 transition-colors whitespace-nowrap"
                        >
                            <img
                                src="/mesa icon.png"
                                alt=""
                                className="h-4 w-4 sm:h-[18px] sm:w-[18px] object-contain dark:invert shrink-0"
                                draggable={false}
                            />
                            <span className="inline min-[520px]:hidden">Reserva</span>
                            <span className="hidden min-[520px]:inline xl:hidden">Reservar</span>
                            <span className="hidden xl:inline">Reservar mesa</span>
                        </Link>
                        <Link
                            to="/cliente"
                            className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                        >
                            <img
                                src="/boton de volver al main icon.png"
                                alt=""
                                className="h-4 w-4 sm:h-[18px] sm:w-[18px] object-contain dark:invert shrink-0"
                                draggable={false}
                            />
                            <span className="min-[480px]:hidden">Principal</span>
                            <span className="hidden min-[480px]:inline min-[720px]:hidden">Volver al inicio</span>
                            <span className="hidden min-[720px]:inline">Volver a la página principal</span>
                        </Link>
                        {nombreMostrar ? (
                            <button
                                type="button"
                                onClick={cerrarSesion}
                                className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-medium bg-red-600 text-white border border-red-700/80 hover:bg-red-500 dark:bg-red-600/90 dark:border-red-500/50 dark:hover:bg-red-500 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                                <img
                                    src="/cerrar sesion icon.png"
                                    alt=""
                                    className="h-4 w-4 sm:h-[18px] sm:w-[18px] object-contain brightness-0 invert shrink-0"
                                    draggable={false}
                                />
                                <span className="sm:hidden">Salir</span>
                                <span className="hidden sm:inline">Cerrar sesión</span>
                            </button>
                        ) : (
                            <Link
                                to="/cliente/login"
                                className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-amber-400/85 dark:bg-amber-500/35 text-neutral-950 dark:text-amber-100 hover:bg-amber-400 dark:hover:bg-amber-500/45 border border-amber-500/40 dark:border-amber-400/35 whitespace-nowrap font-semibold"
                            >
                                Entrar
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-6xl px-3 min-[375px]:px-4 sm:px-5 md:px-6 py-6 sm:py-8 md:py-10 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
                {loading ? (
                    <div className="text-center text-stone-600 dark:text-neutral-400 py-20">Cargando carta…</div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-200 max-w-xl">
                        {error}
                    </div>
                ) : productos.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-6 py-12 text-center text-stone-600 dark:text-neutral-400">
                        Aún no hay productos activos en el menú. Vuelve más tarde.
                    </div>
                ) : (
                    <div className="space-y-8 sm:space-y-10">
                        <div
                            className="-mx-1 px-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-neutral-700"
                            role="toolbar"
                            aria-label="Filtrar por categoría"
                        >
                            <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-4">
                                {CARTA_FILTROS.map((f) => (
                                    <FiltroCategoriaBtn
                                        key={f.id}
                                        filtro={f}
                                        activo={categoriaFiltro === f.id}
                                        onClick={() => seleccionarFiltro(f.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {porCategoriaVisible.length === 0 ? (
                            <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-6 py-10 text-center text-stone-600 dark:text-neutral-400">
                                No hay productos en esta categoría por ahora.
                            </div>
                        ) : null}

                        {porCategoriaVisible.map(([cat, items]) => (
                            <CartaCategoriaSection key={cat} categoria={cat} items={items} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
