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

export function ClienteCartaPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                            className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-teal-500/35 text-teal-800 dark:text-teal-300 hover:bg-teal-500/10 transition-colors whitespace-nowrap"
                        >
                            <span className="inline min-[520px]:hidden">Reserva</span>
                            <span className="hidden min-[520px]:inline xl:hidden">Reservar</span>
                            <span className="hidden xl:inline">Reservar mesa</span>
                        </Link>
                        <Link
                            to="/cliente"
                            className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                        >
                            Inicio
                        </Link>
                        {nombreMostrar ? (
                            <button
                                type="button"
                                onClick={cerrarSesion}
                                className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/15 border border-stone-300 dark:border-white/15 whitespace-nowrap"
                            >
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
                    <div className="space-y-14">
                        {porCategoria.map(([cat, items]) => (
                            <section key={cat}>
                                <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50 border-b border-stone-200 dark:border-white/10 pb-2 break-words">
                                    {cat}
                                </h2>
                                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {items.map((p) => (
                                        <article
                                            key={p.idProducto}
                                            className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-neutral-900/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800 border-b border-stone-200 dark:border-white/10 overflow-hidden flex items-center justify-center">
                                                {p.imagenUrl ? (
                                                    <img
                                                        src={p.imagenUrl}
                                                        alt={p.nombreProducto}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-stone-500 dark:text-neutral-600 px-4 text-center">
                                                        Sin imagen
                                                    </span>
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
                                                            p.tipo !== 'BEBIDA' &&
                                                                p.tipo !== 'COMBO' &&
                                                                'bg-amber-500/15 text-amber-900 dark:text-amber-200',
                                                        )}
                                                    >
                                                        {tipoLabel(p.tipo)}
                                                    </span>
                                                </div>
                                                {p.descripcion ? (
                                                    <p className="mt-2 text-sm text-stone-600 dark:text-neutral-400 line-clamp-3">
                                                        {p.descripcion}
                                                    </p>
                                                ) : null}
                                                <div className="mt-3 text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                                                    {formatCOP(p.precio)}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
