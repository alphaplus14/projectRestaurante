import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAlertError } from '../utils/adminAlerts';

const VIEW_STORAGE_KEY = 'admin-productos-view-mode';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? '');
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function emptyDraft() {
    return {
        idProducto: null,
        nombreProducto: '',
        precio: '',
        descripcion: '',
        tipo: 'PLATO',
        categoria_idCategoria: '',
        receta_idReceta: '',
        activo: true,
        imagenUrl: null,
    };
}

function ProductThumb({ imagenUrl, nombre, size = 'md' }) {
    const isSmall = size === 'sm';
    return (
        <div
            className={classNames(
                'shrink-0 overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-700/80 flex items-center justify-center text-stone-600 dark:text-stone-500',
                isSmall ? 'h-10 w-10 rounded-lg text-[10px]' : 'h-40 w-full rounded-t-xl',
            )}
        >
            {imagenUrl ? (
                <img src={imagenUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
                <span className="px-2 text-center leading-tight">{nombre?.slice(0, 2)?.toUpperCase() ?? '—'}</span>
            )}
        </div>
    );
}

function emptyHistorialFiltros() {
    return { producto: '', fecha_desde: '', fecha_hasta: '' };
}

function buildHistorialQs(filtros) {
    const p = new URLSearchParams();
    const nombre = filtros.producto?.trim();
    if (nombre) p.set('producto', nombre);
    if (filtros.fecha_desde) p.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) p.set('fecha_hasta', filtros.fecha_hasta);
    const s = p.toString();
    return s ? `?${s}` : '';
}

function formatFechaHora(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return iso.slice(0, 16).replace('T', ' ');
    }
}

function PanelHistorialActivo({ historial, loading, filtros, onChangeFiltros, onAplicar, onLimpiar }) {
    const hayFiltros = Boolean(filtros.producto?.trim() || filtros.fecha_desde || filtros.fecha_hasta);

    return (
        <div className="space-y-4 max-w-6xl">
            <p className="text-sm text-stone-600 dark:text-stone-400">
                Historial permanente de platos habilitados y deshabilitados (cocina y administración). No se puede eliminar.
            </p>
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Plato</label>
                        <input
                            type="search"
                            value={filtros.producto}
                            onChange={(e) => onChangeFiltros((f) => ({ ...f, producto: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && onAplicar()}
                            placeholder="Nombre del plato…"
                            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Fecha desde</label>
                        <input
                            type="date"
                            value={filtros.fecha_desde}
                            onChange={(e) => onChangeFiltros((f) => ({ ...f, fecha_desde: e.target.value }))}
                            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Fecha hasta</label>
                        <input
                            type="date"
                            value={filtros.fecha_hasta}
                            min={filtros.fecha_desde || undefined}
                            onChange={(e) => onChangeFiltros((f) => ({ ...f, fecha_hasta: e.target.value }))}
                            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button type="button" onClick={onAplicar} disabled={loading} className="rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-2 text-sm disabled:opacity-50">
                        {loading ? 'Buscando…' : 'Aplicar filtros'}
                    </button>
                    <button type="button" onClick={onLimpiar} disabled={loading || !hayFiltros} className="rounded-lg border border-stone-300 dark:border-stone-700 px-4 py-2 text-sm disabled:opacity-50">
                        Limpiar
                    </button>
                    {historial != null ? (
                        <span className="text-xs text-stone-500">{historial.total} registro{historial.total !== 1 ? 's' : ''}</span>
                    ) : null}
                </div>
            </div>
            {loading ? (
                <div className="py-16 text-center text-stone-500">Cargando historial…</div>
            ) : (
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-100 dark:bg-stone-950/50 text-xs uppercase text-stone-500">
                            <tr>
                                {['Fecha / hora', 'Plato', 'Acción', 'Periodo', 'Usuario'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {(historial?.data ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                                        {hayFiltros ? 'Sin registros con esos filtros.' : 'Sin cambios registrados aún.'}
                                    </td>
                                </tr>
                            ) : (
                                historial.data.map((row) => (
                                    <tr key={row.idLog} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">{formatFechaHora(row.creado_en)}</td>
                                        <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-50">{row.producto?.nombreProducto ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={classNames(
                                                    'text-xs font-semibold px-2 py-0.5 rounded-full border',
                                                    row.activo
                                                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
                                                        : 'bg-red-900/40 text-red-300 border-red-700/50',
                                                )}
                                            >
                                                {row.accion}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400 text-xs whitespace-nowrap">
                                            {!row.activo && row.periodo_fin ? (
                                                <>
                                                    {formatFechaHora(row.creado_en).split(',')[1]?.trim() ?? ''} –{' '}
                                                    {formatFechaHora(row.periodo_fin).split(',')[1]?.trim() ?? ''}
                                                    <div className="text-stone-500 mt-0.5">{formatFechaHora(row.periodo_fin).split(',')[0]}</div>
                                                </>
                                            ) : row.activo ? (
                                                '—'
                                            ) : (
                                                <span className="text-amber-600 dark:text-amber-400">Aún deshabilitado</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-stone-600 dark:text-stone-500">
                                            <div>{row.usuario}</div>
                                            {row.usuario_rol ? <div className="text-[10px] uppercase mt-0.5">{row.usuario_rol}</div> : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export function AdminProductosPage() {
    const [tab, setTab] = useState('productos');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [viewMode, setViewMode] = useState(() => {
        try {
            const v = localStorage.getItem(VIEW_STORAGE_KEY);
            return v === 'cards' ? 'cards' : 'table';
        } catch {
            return 'table';
        }
    });

    const [eliminados, setEliminados] = useState([]);
    const [eliminadosLoading, setEliminadosLoading] = useState(false);
    const [totalEliminados, setTotalEliminados] = useState(0);
    const [restaurandoId, setRestaurandoId] = useState(null);

    const [isOpen, setIsOpen] = useState(false);
    const [listaPorCategoriaAbierta, setListaPorCategoriaAbierta] = useState(false);
    const [draft, setDraft] = useState(emptyDraft());
    const [imageFile, setImageFile] = useState(null);
    const [localImagePreview, setLocalImagePreview] = useState(null);
    const [historial, setHistorial] = useState(null);
    const [historialLoading, setHistorialLoading] = useState(false);
    const [historialFiltros, setHistorialFiltros] = useState(emptyHistorialFiltros);
    const [historialFiltrosAplicados, setHistorialFiltrosAplicados] = useState(emptyHistorialFiltros);

    const cargarHistorial = useCallback(async (filtros) => {
        setHistorialLoading(true);
        try {
            const qs = buildHistorialQs(filtros);
            const res = await apiFetch(`/api/admin/productos/historial-activo${qs}`);
            setHistorial(res);
        } catch (err) {
            void adminAlertError(err, 'Historial del menú');
            setHistorial(null);
        } finally {
            setHistorialLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab !== 'historial') return;
        void cargarHistorial(historialFiltrosAplicados);
    }, [tab, historialFiltrosAplicados, cargarHistorial]);

    const categoriasById = useMemo(() => {
        const m = new Map();
        for (const c of categorias) m.set(String(c.idCategoria), c);
        return m;
    }, [categorias]);

    /** Secciones ordenadas: categorías por `orden` + nombre; productos alfabéticos dentro de cada una. */
    const seccionesPorCategoria = useMemo(() => {
        const sortedNombre = (a, b) =>
            String(a.nombreProducto).localeCompare(String(b.nombreProducto), 'es', { sensitivity: 'base' });

        const categoriasOrdenadas = [...categorias].sort((a, b) => {
            const o = (Number(a.orden) || 0) - (Number(b.orden) || 0);
            if (o !== 0) return o;
            return String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' });
        });

        const used = new Set();
        const sections = [];

        for (const c of categoriasOrdenadas) {
            const list = productos
                .filter((p) => Number(p.categoria_idCategoria) === Number(c.idCategoria))
                .sort(sortedNombre);
            if (!list.length) continue;
            list.forEach((p) => used.add(p.idProducto));
            sections.push({ key: `cat-${c.idCategoria}`, titulo: c.nombre, productos: list });
        }

        const sinSeccion = productos.filter((p) => !used.has(p.idProducto)).sort(sortedNombre);
        if (sinSeccion.length) {
            sections.push({ key: 'sin-categoria', titulo: 'Sin categoría asignada', productos: sinSeccion });
        }

        return sections;
    }, [productos, categorias]);

    function resetImageSelection() {
        setLocalImagePreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setImageFile(null);
    }

    async function load() {
        setLoading(true);
        try {
            const data = await apiFetch('/api/admin/productos');
            setProductos(Array.isArray(data?.data) ? data.data : []);
            setCategorias(Array.isArray(data?.categorias) ? data.categorias : []);
            setTotalEliminados(Number(data?.total_eliminados) || 0);
        } catch (err) {
            void adminAlertError(err, 'No se pudieron cargar los productos');
        } finally {
            setLoading(false);
        }
    }

    const cargarEliminados = useCallback(async () => {
        setEliminadosLoading(true);
        try {
            const data = await apiFetch('/api/admin/productos?eliminados=1');
            setEliminados(Array.isArray(data?.data) ? data.data : []);
            setTotalEliminados(Number(data?.total_eliminados) || 0);
        } catch (err) {
            void adminAlertError(err, 'No se pudieron cargar los platos borrados');
        } finally {
            setEliminadosLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab !== 'eliminados') return;
        void cargarEliminados();
    }, [tab, cargarEliminados]);

    function setViewModePersist(next) {
        setViewMode(next);
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, next);
        } catch {
            /* ignore */
        }
    }

    function openCreate() {
        resetImageSelection();
        setDraft(emptyDraft());
        setIsOpen(true);
    }

    function openEdit(p) {
        resetImageSelection();
        setDraft({
            idProducto: p.idProducto,
            nombreProducto: p.nombreProducto ?? '',
            precio: p.precio ?? '',
            descripcion: p.descripcion ?? '',
            tipo: p.tipo ?? 'PLATO',
            categoria_idCategoria: p.categoria_idCategoria ?? '',
            receta_idReceta: p.receta_idReceta ?? '',
            activo: Boolean(p.activo),
            imagenUrl: p.imagenUrl ?? null,
        });
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
        resetImageSelection();
        setDraft(emptyDraft());
    }

    function onPickImage(e) {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setLocalImagePreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(f);
        });
        setImageFile(f);
    }

    async function saveDraft(e) {
        e.preventDefault();
        setSaving(true);

        const basePayload = {
            nombreProducto: String(draft.nombreProducto || '').trim(),
            precio: Number(draft.precio),
            descripcion: draft.descripcion ? String(draft.descripcion) : null,
            tipo: draft.tipo,
            categoria_idCategoria: Number(draft.categoria_idCategoria),
            receta_idReceta: draft.receta_idReceta ? Number(draft.receta_idReceta) : null,
            activo: Boolean(draft.activo),
        };

        try {
            const useMultipart = imageFile instanceof File;

            if (useMultipart) {
                const fd = new FormData();
                fd.append('nombreProducto', basePayload.nombreProducto);
                fd.append('precio', String(basePayload.precio));
                if (basePayload.descripcion != null) fd.append('descripcion', basePayload.descripcion);
                fd.append('tipo', basePayload.tipo);
                fd.append('categoria_idCategoria', String(basePayload.categoria_idCategoria));
                if (basePayload.receta_idReceta != null) {
                    fd.append('receta_idReceta', String(basePayload.receta_idReceta));
                }
                fd.append('activo', basePayload.activo ? '1' : '0');
                fd.append('imagen', imageFile);

                if (draft.idProducto) {
                    await apiFetch(`/api/admin/productos/${draft.idProducto}`, {
                        method: 'POST',
                        body: fd,
                    });
                } else {
                    await apiFetch('/api/admin/productos', {
                        method: 'POST',
                        body: fd,
                    });
                }
            } else if (draft.idProducto) {
                await apiFetch(`/api/admin/productos/${draft.idProducto}`, {
                    method: 'PUT',
                    body: JSON.stringify(basePayload),
                });
            } else {
                await apiFetch('/api/admin/productos', {
                    method: 'POST',
                    body: JSON.stringify(basePayload),
                });
            }

            await load();
            closeModal();
        } catch (err) {
            void adminAlertError(err, 'No se pudo guardar el producto');
        } finally {
            setSaving(false);
        }
    }

    async function toggleActivo(p) {
        try {
            await apiFetch(`/api/admin/productos/${p.idProducto}/activo`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: !p.activo }),
            });
            await load();
        } catch (err) {
            void adminAlertError(err, 'No se pudo cambiar el estado');
        }
    }

    async function deleteProducto(p) {
        const ok = window.confirm(
            `¿Eliminar "${p.nombreProducto}"?\n\nNo se borra de la base de datos: dejará de mostrarse en el menú y podrás restaurarlo desde «Platos borrados».`,
        );
        if (!ok) return;

        try {
            await apiFetch(`/api/admin/productos/${p.idProducto}`, { method: 'DELETE' });
            await load();
        } catch (err) {
            void adminAlertError(err, 'No se pudo eliminar el producto');
        }
    }

    async function restaurarProducto(p) {
        setRestaurandoId(p.idProducto);
        try {
            await apiFetch(`/api/admin/productos/${p.idProducto}/restaurar`, { method: 'POST' });
            await Promise.all([cargarEliminados(), load()]);
        } catch (err) {
            void adminAlertError(err, 'No se pudo restaurar el producto');
        } finally {
            setRestaurandoId(null);
        }
    }

    function categoriaNombre(p) {
        return (
            p.categoria?.nombre || categoriasById.get(String(p.categoria_idCategoria))?.nombre || '—'
        );
    }

    if (loading && tab === 'productos') {
        return (
            <AdminLayout title="Menú">
                <div className="flex items-center justify-center text-stone-600 dark:text-stone-400 text-lg py-20">Cargando productos…</div>
            </AdminLayout>
        );
    }

    const coverSrc = localImagePreview || draft.imagenUrl;

    return (
        <AdminLayout title="Menú">
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <div className="text-3xl font-semibold tracking-tight">Menú</div>
                    <div className="mt-2 text-stone-600 dark:text-stone-400">
                        Administra el menú. Deshabilitar es preferido sobre eliminar.
                    </div>
                    <div className="mt-4 inline-flex rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-1">
                        <button
                            type="button"
                            onClick={() => setTab('productos')}
                            className={classNames(
                                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                                tab === 'productos' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-50' : 'text-stone-600 dark:text-stone-400',
                            )}
                        >
                            Productos
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('historial')}
                            className={classNames(
                                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                                tab === 'historial' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-50' : 'text-stone-600 dark:text-stone-400',
                            )}
                        >
                            Historial
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('eliminados')}
                            className={classNames(
                                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                                tab === 'eliminados' ? 'bg-red-700 text-stone-50' : 'text-stone-600 dark:text-stone-400',
                            )}
                        >
                            Platos borrados{totalEliminados > 0 ? ` (${totalEliminados})` : ''}
                        </button>
                    </div>
                </div>
                {tab === 'productos' ? (
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-1">
                        <button
                            type="button"
                            onClick={() => setViewModePersist('table')}
                            className={classNames(
                                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                                viewMode === 'table'
                                    ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:text-stone-200',
                            )}
                        >
                            Tabla
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewModePersist('cards')}
                            className={classNames(
                                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                                viewMode === 'cards'
                                    ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:text-stone-200',
                            )}
                        >
                            Tarjetas
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setListaPorCategoriaAbierta((v) => !v)}
                        aria-expanded={listaPorCategoriaAbierta}
                        className={classNames(
                            'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                            listaPorCategoriaAbierta
                                ? 'border-amber-500/40 bg-amber-600/15 text-amber-900 dark:text-amber-200'
                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60',
                        )}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={classNames('h-4 w-4 shrink-0 transition-transform', listaPorCategoriaAbierta ? 'rotate-180' : '')}
                            aria-hidden
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                        Lista por categoría
                    </button>
                    <button
                        onClick={openCreate}
                        className="bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                        Crear producto
                    </button>
                </div>
                ) : null}
            </div>

            {tab === 'eliminados' ? (
                <div className="mt-6 max-w-6xl space-y-4">
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        Platos eliminados del menú. Siguen guardados en la base de datos y puedes restaurarlos en cualquier
                        momento; al restaurarlos vuelven a quedar activos en el menú.
                    </p>
                    {eliminadosLoading ? (
                        <div className="py-16 text-center text-stone-500">Cargando platos borrados…</div>
                    ) : (
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[640px]">
                                    <thead className="text-stone-600 dark:text-stone-400">
                                        <tr className="border-b border-stone-200 dark:border-stone-800">
                                            <th className="text-left font-medium px-4 py-3 w-14">Foto</th>
                                            <th className="text-left font-medium px-4 py-3">Producto</th>
                                            <th className="text-left font-medium px-4 py-3">Categoría</th>
                                            <th className="text-right font-medium px-4 py-3">Precio</th>
                                            <th className="text-left font-medium px-4 py-3">Eliminado el</th>
                                            <th className="text-right font-medium px-4 py-3">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                        {eliminados.map((p) => (
                                            <tr key={p.idProducto} className="hover:bg-stone-100/70 dark:hover:bg-stone-800/35">
                                                <td className="px-4 py-3 align-middle">
                                                    <ProductThumb imagenUrl={p.imagenUrl} nombre={p.nombreProducto} size="sm" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{p.nombreProducto}</div>
                                                    {p.descripcion ? (
                                                        <div className="mt-0.5 text-stone-600 dark:text-stone-500 line-clamp-1">{p.descripcion}</div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{categoriaNombre(p)}</td>
                                                <td className="px-4 py-3 text-right">{formatCOP(p.precio)}</td>
                                                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 text-xs whitespace-nowrap">
                                                    {formatFechaHora(p.eliminado_en)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => restaurarProducto(p)}
                                                            disabled={restaurandoId === p.idProducto}
                                                            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-stone-50 font-semibold focus-visible:ring-2 focus-visible:ring-amber-500"
                                                        >
                                                            {restaurandoId === p.idProducto ? 'Restaurando…' : 'Restaurar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {eliminados.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-stone-600 dark:text-stone-500">
                                                    No hay platos borrados.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : tab === 'historial' ? (
                <PanelHistorialActivo
                    historial={historial}
                    loading={historialLoading}
                    filtros={historialFiltros}
                    onChangeFiltros={setHistorialFiltros}
                    onAplicar={() => setHistorialFiltrosAplicados({ ...historialFiltros })}
                    onLimpiar={() => {
                        const vacio = emptyHistorialFiltros();
                        setHistorialFiltros(vacio);
                        setHistorialFiltrosAplicados(vacio);
                    }}
                />
            ) : (
            <>
            {listaPorCategoriaAbierta ? (
                <div className="mt-6 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">Menú ordenado por categoría</h2>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                                Mismo orden que en carta (campo orden de categoría). Dentro de cada categoría, platos en
                                orden alfabético.
                            </p>
                        </div>
                        <span className="text-xs text-stone-600 dark:text-stone-500 tabular-nums shrink-0">
                            {productos.length} producto{productos.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {seccionesPorCategoria.length === 0 ? (
                        <p className="mt-6 text-sm text-stone-600 dark:text-stone-500">No hay productos para listar.</p>
                    ) : (
                        <div className="mt-6 space-y-8">
                            {seccionesPorCategoria.map((sec) => (
                                <section key={sec.key} className="border-b border-stone-200 dark:border-stone-800 last:border-0 pb-8 last:pb-0">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-500/90 mb-3">
                                        {sec.titulo}
                                    </h3>
                                    <ul className="space-y-2">
                                        {sec.productos.map((p, i) => (
                                            <li key={p.idProducto} className="flex gap-3 text-sm text-stone-900 dark:text-stone-50">
                                                <span className="text-stone-600 dark:text-stone-500 tabular-nums w-6 shrink-0 text-right pt-0.5">
                                                    {i + 1}.
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-medium">{p.nombreProducto}</span>
                                                    <span className="text-stone-600 dark:text-stone-500"> · </span>
                                                    <span className="text-stone-600 dark:text-stone-400">{formatCOP(p.precio)}</span>
                                                    {!p.activo ? (
                                                        <span className="ml-2 text-xs text-stone-600 dark:text-stone-500">(inactivo)</span>
                                                    ) : null}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            {viewMode === 'table' ? (
                <div className="mt-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-stone-600 dark:text-stone-400">
                                <tr className="border-b border-stone-200 dark:border-stone-800">
                                    <th className="text-left font-medium px-4 py-3 w-14">Foto</th>
                                    <th className="text-left font-medium px-4 py-3">Producto</th>
                                    <th className="text-left font-medium px-4 py-3">Categoría</th>
                                    <th className="text-left font-medium px-4 py-3">Tipo</th>
                                    <th className="text-right font-medium px-4 py-3">Precio</th>
                                    <th className="text-left font-medium px-4 py-3">Estado</th>
                                    <th className="text-right font-medium px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                {productos.map((p) => (
                                    <tr key={p.idProducto} className="hover:bg-stone-100/70 dark:hover:bg-stone-800/35">
                                        <td className="px-4 py-3 align-middle">
                                            <ProductThumb imagenUrl={p.imagenUrl} nombre={p.nombreProducto} size="sm" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{p.nombreProducto}</div>
                                            {p.descripcion ? (
                                                <div className="mt-0.5 text-stone-600 dark:text-stone-500 line-clamp-1">{p.descripcion}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{categoriaNombre(p)}</td>
                                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{p.tipo}</td>
                                        <td className="px-4 py-3 text-right">{formatCOP(p.precio)}</td>
                                        <td className="px-4 py-3">
                                            {p.activo ? (
                                                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-900 dark:text-amber-200">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-700 dark:text-stone-300">
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => toggleActivo(p)}
                                                    className={classNames(
                                                        'px-3 py-2 rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                                                        p.activo
                                                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                                                            : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 border border-amber-500/30',
                                                    )}
                                                >
                                                    {p.activo ? 'Deshabilitar' : 'Habilitar'}
                                                </button>
                                                <button
                                                    onClick={() => deleteProducto(p)}
                                                    className="px-3 py-2 rounded-lg bg-red-700/10 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-700/20 dark:hover:bg-red-900/50 focus-visible:ring-2 focus-visible:ring-red-500"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {productos.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-10 text-center text-stone-600 dark:text-stone-400" colSpan={7}>
                                            No hay productos aún.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {productos.map((p) => (
                        <div
                            key={p.idProducto}
                            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden flex flex-col"
                        >
                            <ProductThumb imagenUrl={p.imagenUrl} nombre={p.nombreProducto} size="lg" />
                            <div className="p-5 flex-1 flex flex-col gap-3">
                                <div>
                                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-50 leading-snug">{p.nombreProducto}</div>
                                    <div className="mt-1 text-sm text-stone-600 dark:text-stone-500">{categoriaNombre(p)}</div>
                                </div>
                                {p.descripcion ? (
                                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 flex-1">{p.descripcion}</p>
                                ) : (
                                    <div className="flex-1" />
                                )}
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="text-amber-800 dark:text-amber-200 font-semibold tabular-nums">{formatCOP(p.precio)}</div>
                                    <span className="text-xs font-medium text-stone-600 dark:text-stone-500 border border-stone-200 dark:border-stone-800 rounded-full px-2 py-0.5">
                                        {p.tipo}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                                    {p.activo ? (
                                        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-900 dark:text-amber-200">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-700 dark:text-stone-300">
                                            Inactivo
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => openEdit(p)}
                                        className="flex-1 min-w-[100px] px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500 text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => toggleActivo(p)}
                                        className={classNames(
                                            'flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                                            p.activo
                                                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                                                : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 border border-amber-500/30',
                                        )}
                                    >
                                        {p.activo ? 'Deshabilitar' : 'Habilitar'}
                                    </button>
                                    <button
                                        onClick={() => deleteProducto(p)}
                                        className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-red-700/10 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-700/20 dark:hover:bg-red-900/50 focus-visible:ring-2 focus-visible:ring-red-500 text-sm font-medium"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {productos.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/60 px-6 py-16 text-center text-stone-600 dark:text-stone-400">
                            No hay productos aún.
                        </div>
                    ) : null}
                </div>
            )}

            </>
            )}

            {isOpen ? (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
                    <div className="absolute inset-0 flex items-center justify-center p-6 overflow-y-auto">
                        <div className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 relative my-8">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="text-lg font-semibold">
                                        {draft.idProducto ? 'Editar producto' : 'Crear producto'}
                                    </div>
                                    <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                                        Precio mínimo: $500 COP. Nombre único por categoría. Imagen opcional (PHP suele limitar a 2 MB por archivo; para subir más, en backend ejecuta: composer run serve-uploads).
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="rounded-lg px-3 py-2 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                >
                                    Cerrar
                                </button>
                            </div>

                            <form className="mt-6 space-y-4" onSubmit={saveDraft}>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Foto del plato (opcional)</label>
                                    <div className="mt-2 flex flex-col sm:flex-row gap-4 items-start">
                                        <div className="w-full sm:w-40 shrink-0 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 aspect-square flex items-center justify-center text-stone-600 dark:text-stone-500 text-xs">
                                            {coverSrc ? (
                                                <img src={coverSrc} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span>Sin imagen</span>
                                            )}
                                        </div>
                                        <div className="flex-1 w-full space-y-2">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                onChange={onPickImage}
                                                className="block w-full text-sm text-stone-700 dark:text-stone-300 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200 dark:file:bg-stone-800 file:px-4 file:py-2 file:text-stone-900 dark:file:text-stone-100 file:font-medium hover:file:bg-stone-300 dark:hover:file:bg-stone-700"
                                            />
                                            {imageFile ? (
                                                <button
                                                    type="button"
                                                    onClick={() => resetImageSelection()}
                                                    className="text-sm text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
                                                >
                                                    Quitar imagen nueva
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Nombre</label>
                                    <input
                                        value={draft.nombreProducto}
                                        onChange={(e) => setDraft((d) => ({ ...d, nombreProducto: e.target.value }))}
                                        className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        placeholder="Ej: Arroz con Pollo"
                                        required
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Precio (COP)</label>
                                        <input
                                            value={draft.precio}
                                            onChange={(e) => setDraft((d) => ({ ...d, precio: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            placeholder="Ej: 18000"
                                            inputMode="numeric"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Tipo</label>
                                        <select
                                            value={draft.tipo}
                                            onChange={(e) => setDraft((d) => ({ ...d, tipo: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        >
                                            <option value="PLATO">PLATO</option>
                                            <option value="BEBIDA">BEBIDA</option>
                                            <option value="COMBO">COMBO</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Categoría</label>
                                        <select
                                            value={draft.categoria_idCategoria}
                                            onChange={(e) => setDraft((d) => ({ ...d, categoria_idCategoria: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            required
                                        >
                                            <option value="" disabled>
                                                Selecciona…
                                            </option>
                                            {categorias.map((c) => (
                                                <option key={c.idCategoria} value={String(c.idCategoria)}>
                                                    {c.nombre} {c.activa ? '' : '(inactiva)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Estado</label>
                                        <select
                                            value={draft.activo ? '1' : '0'}
                                            onChange={(e) => setDraft((d) => ({ ...d, activo: e.target.value === '1' }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        >
                                            <option value="1">Activo</option>
                                            <option value="0">Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Descripción (opcional)</label>
                                    <textarea
                                        value={draft.descripcion}
                                        onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
                                        className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-24"
                                        placeholder="Ej: Plato típico, porción personal."
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg px-6 py-3 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={classNames(
                                            'bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500',
                                            saving ? 'opacity-60 cursor-not-allowed' : '',
                                        )}
                                    >
                                        {saving ? 'Guardando…' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    );
}
