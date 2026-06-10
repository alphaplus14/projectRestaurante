import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { apiFetch } from '../auth/apiClient';
import { staffLoginUrl } from '../auth/staffLogin';
import { logoutTenantSession } from '../auth/logoutSession';
import { ThemeToggle } from '../theme/ThemeToggle';
import { confirmStaffLogout } from '../utils/confirmLogout';

const PAGE_SIZE = 8;

const SORT_OPTIONS = [{ value: 'nombre_asc', label: 'Nombre A–Z' }];

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const fieldClass =
    'w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500';

function formatCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function sortProductos(lista) {
    return [...lista].sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto, 'es'));
}

export function CocinaMenuPage() {
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('nombre_asc');
    const [filtroEstado, setFiltroEstado] = useState('habilitados');
    const [pagina, setPagina] = useState(1);
    const [busyId, setBusyId] = useState(null);
    const [loadError, setLoadError] = useState('');

    const cargar = useCallback(async (opts = {}) => {
        const silent = Boolean(opts.silent);
        if (!silent) setLoading(true);
        try {
            const res = await apiFetch('/api/cocina/menu/productos');
            setProductos(Array.isArray(res?.data) ? res.data : []);
            setLoadError('');
        } catch (e) {
            setLoadError(e?.message || 'No se pudo cargar el menú.');
            if (!silent) setProductos([]);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    useEffect(() => {
        setPagina(1);
    }, [search, sortBy, filtroEstado]);

    const filtrados = useMemo(() => {
        let lista = productos;
        if (filtroEstado === 'habilitados') {
            lista = lista.filter((p) => p.activo);
        } else if (filtroEstado === 'deshabilitados') {
            lista = lista.filter((p) => !p.activo);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            lista = lista.filter(
                (p) =>
                    p.nombreProducto.toLowerCase().includes(q) ||
                    (p.categoria?.nombre ?? '').toLowerCase().includes(q),
            );
        }
        return sortProductos(lista);
    }, [productos, search, filtroEstado]);

    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE)), [filtrados.length]);
    const paginados = useMemo(() => {
        const start = (pagina - 1) * PAGE_SIZE;
        return filtrados.slice(start, start + PAGE_SIZE);
    }, [filtrados, pagina]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    const conteos = useMemo(() => {
        const activos = productos.filter((p) => p.activo).length;
        return { activos, inactivos: productos.length - activos };
    }, [productos]);

    async function toggleActivo(p) {
        const nuevoActivo = !p.activo;
        const accion = nuevoActivo ? 'habilitar' : 'deshabilitar';
        const dark = document.documentElement.classList.contains('dark');
        const confirm = await Swal.fire({
            icon: 'question',
            title: nuevoActivo ? '¿Habilitar plato?' : '¿Deshabilitar plato?',
            html: `<p class="text-sm"><strong>${p.nombreProducto}</strong> ${nuevoActivo ? 'volverá al menú del mesero.' : 'dejará de aparecer para nuevos pedidos.'}</p><p class="text-xs mt-2">El mesero recibirá una notificación.</p>`,
            showCancelButton: true,
            confirmButtonText: nuevoActivo ? 'Sí, habilitar' : 'Sí, deshabilitar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: nuevoActivo ? '#d97706' : '#dc2626',
            background: dark ? '#1c1917' : '#fafaf9',
            color: dark ? '#fafaf9' : '#1c1917',
        });
        if (!confirm.isConfirmed) return;

        setBusyId(p.idProducto);
        try {
            await apiFetch(`/api/cocina/menu/productos/${p.idProducto}/activo`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: nuevoActivo }),
            });
            await cargar({ silent: true });
            void Swal.fire({
                icon: 'success',
                title: nuevoActivo ? 'Plato habilitado' : 'Plato deshabilitado',
                text: 'El mesero fue notificado.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (e) {
            void Swal.fire({ icon: 'error', title: `No se pudo ${accion}`, text: e?.message || 'Intenta de nuevo.' });
        } finally {
            setBusyId(null);
        }
    }

    async function solicitarSalir() {
        const ok = await confirmStaffLogout();
        if (!ok) return;
        await logoutTenantSession();
        window.location.href = staffLoginUrl('COCINERO');
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Menú</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Habilitar o deshabilitar platos del restaurante</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/cocina"
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                            Pedidos
                        </Link>
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => void solicitarSalir()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-600/80 bg-red-600 hover:bg-red-500 px-3 py-2 text-sm font-medium text-white"
                        >
                            <img src="/cerrar sesion icon.png" alt="" className="h-4 w-4 brightness-0 invert" aria-hidden />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
                {loadError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">{loadError}</div>
                ) : null}

                {!loading && productos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFiltroEstado('habilitados')}
                            className={classNames(
                                'rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                filtroEstado === 'habilitados'
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/40'
                                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50',
                            )}
                        >
                            <p className="text-xs uppercase font-semibold text-stone-500">Habilitados</p>
                            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{conteos.activos}</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFiltroEstado('deshabilitados')}
                            className={classNames(
                                'rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                filtroEstado === 'deshabilitados'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 ring-1 ring-red-500/40'
                                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50',
                            )}
                        >
                            <p className="text-xs uppercase font-semibold text-stone-500">Deshabilitados</p>
                            <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">{conteos.inactivos}</p>
                        </button>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-3 items-end justify-between">
                    <div className="flex flex-wrap gap-3 flex-1 min-w-0">
                        <div className="min-w-[160px] flex-1 max-w-xs">
                            <label className="block text-xs text-stone-500 mb-1">Buscar</label>
                            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Plato o categoría…" className={fieldClass} />
                        </div>
                        <div className="min-w-[160px]">
                            <label className="block text-xs text-stone-500 mb-1">Ordenar</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={fieldClass}>
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button type="button" onClick={() => void cargar()} className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800">
                        Actualizar
                    </button>
                </div>

                {loading ? (
                    <p className="text-center py-16 text-stone-500">Cargando menú…</p>
                ) : (
                    <>
                        <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-100 dark:bg-stone-950/50 text-xs uppercase text-stone-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Plato</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Categoría</th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Precio</th>
                                        <th className="px-4 py-3 text-left">Estado</th>
                                        <th className="px-4 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                    {paginados.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                                                {search
                                                    ? 'Sin coincidencias.'
                                                    : filtroEstado === 'deshabilitados'
                                                      ? 'No hay platos deshabilitados.'
                                                      : 'No hay platos habilitados.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginados.map((p) => (
                                            <tr key={p.idProducto} className={classNames(!p.activo && 'bg-stone-50/80 dark:bg-stone-900/50')}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {p.imagenUrl ? (
                                                            <img src={p.imagenUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xs text-stone-500">
                                                                {p.nombreProducto.slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-stone-900 dark:text-stone-50">{p.nombreProducto}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell text-stone-500">{p.categoria?.nombre ?? '—'}</td>
                                                <td className="px-4 py-3 hidden md:table-cell tabular-nums">{formatCOP(p.precio)}</td>
                                                <td className="px-4 py-3">
                                                    {p.activo ? (
                                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Habilitado</span>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Deshabilitado</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={busyId === p.idProducto}
                                                        onClick={() => void toggleActivo(p)}
                                                        className={classNames(
                                                            'rounded-lg text-xs font-semibold px-3 py-1.5 disabled:opacity-50',
                                                            p.activo
                                                                ? 'border border-red-600/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30'
                                                                : 'bg-amber-600 hover:bg-amber-500 text-stone-950',
                                                        )}
                                                    >
                                                        {busyId === p.idProducto ? '…' : p.activo ? 'Deshabilitar' : 'Habilitar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {filtrados.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800 px-4 py-3 bg-stone-50/80 dark:bg-stone-950/40">
                                    <p className="text-sm text-stone-600 dark:text-stone-400">
                                        {filtrados.length} plato{filtrados.length !== 1 ? 's' : ''}
                                        {totalPaginas > 1 ? ` · mostrando ${(pagina - 1) * PAGE_SIZE + 1}–${Math.min(pagina * PAGE_SIZE, filtrados.length)}` : ''}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={pagina <= 1}
                                            onClick={() => setPagina((n) => Math.max(1, n - 1))}
                                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400 min-w-[4.5rem] text-center">
                                            {pagina} / {totalPaginas}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={pagina >= totalPaginas}
                                            onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </>
                )}

                <p className="text-xs text-stone-500">
                    Cada cambio queda en el historial del administrador (Menú) y notifica al mesero. No se puede borrar el historial.
                </p>
            </div>
        </div>
    );
}
