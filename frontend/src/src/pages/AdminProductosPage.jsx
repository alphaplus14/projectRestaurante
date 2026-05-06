import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';

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
    };
}

export function AdminProductosPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState(emptyDraft());

    const categoriasById = useMemo(() => {
        const m = new Map();
        for (const c of categorias) m.set(String(c.idCategoria), c);
        return m;
    }, [categorias]);

    async function load() {
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch('/api/admin/productos');
            setProductos(Array.isArray(data?.data) ? data.data : []);
            setCategorias(Array.isArray(data?.categorias) ? data.categorias : []);
        } catch (err) {
            setError(err?.message || 'No se pudo cargar productos.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openCreate() {
        setDraft(emptyDraft());
        setIsOpen(true);
    }

    function openEdit(p) {
        setDraft({
            idProducto: p.idProducto,
            nombreProducto: p.nombreProducto ?? '',
            precio: p.precio ?? '',
            descripcion: p.descripcion ?? '',
            tipo: p.tipo ?? 'PLATO',
            categoria_idCategoria: p.categoria_idCategoria ?? '',
            receta_idReceta: p.receta_idReceta ?? '',
            activo: Boolean(p.activo),
        });
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
        setDraft(emptyDraft());
        setError('');
    }

    async function saveDraft(e) {
        e.preventDefault();
        setError('');
        setSaving(true);

        const payload = {
            nombreProducto: String(draft.nombreProducto || '').trim(),
            precio: Number(draft.precio),
            descripcion: draft.descripcion ? String(draft.descripcion) : null,
            tipo: draft.tipo,
            categoria_idCategoria: Number(draft.categoria_idCategoria),
            receta_idReceta: draft.receta_idReceta ? Number(draft.receta_idReceta) : null,
            activo: Boolean(draft.activo),
        };

        try {
            if (draft.idProducto) {
                await apiFetch(`/api/admin/productos/${draft.idProducto}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch('/api/admin/productos', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            await load();
            closeModal();
        } catch (err) {
            setError(err?.message || 'No se pudo guardar.');
        } finally {
            setSaving(false);
        }
    }

    async function toggleActivo(p) {
        setError('');
        try {
            await apiFetch(`/api/admin/productos/${p.idProducto}/activo`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: !p.activo }),
            });
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo actualizar el estado.');
        }
    }

    async function deleteProducto(p) {
        setError('');
        const ok = window.confirm(
            `¿Eliminar "${p.nombreProducto}"?\n\nSi el producto tiene pedidos asociados, el sistema no permitirá eliminarlo.`,
        );
        if (!ok) return;

        try {
            await apiFetch(`/api/admin/productos/${p.idProducto}`, { method: 'DELETE' });
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo eliminar.');
        }
    }

    if (loading) {
        return (
            <AdminLayout title="Productos">
                <div className="flex items-center justify-center text-stone-400 text-lg py-20">Cargando productos…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Productos">
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <div className="text-3xl font-semibold tracking-tight">Productos</div>
                    <div className="mt-2 text-stone-400">
                        Administra el menú. Deshabilitar es preferido sobre eliminar.
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                    Crear producto
                </button>
            </div>

            {error ? (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            ) : null}

            <div className="mt-8 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-stone-400">
                            <tr className="border-b border-stone-800">
                                <th className="text-left font-medium px-4 py-3">Producto</th>
                                <th className="text-left font-medium px-4 py-3">Categoría</th>
                                <th className="text-left font-medium px-4 py-3">Tipo</th>
                                <th className="text-right font-medium px-4 py-3">Precio</th>
                                <th className="text-left font-medium px-4 py-3">Estado</th>
                                <th className="text-right font-medium px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800">
                            {productos.map((p) => (
                                <tr key={p.idProducto} className="hover:bg-stone-900/60">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{p.nombreProducto}</div>
                                        {p.descripcion ? (
                                            <div className="mt-0.5 text-stone-500 line-clamp-1">{p.descripcion}</div>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-stone-400">
                                        {p.categoria?.nombre ||
                                            categoriasById.get(String(p.categoria_idCategoria))?.nombre ||
                                            '—'}
                                    </td>
                                    <td className="px-4 py-3 text-stone-400">{p.tipo}</td>
                                    <td className="px-4 py-3 text-right">{formatCOP(p.precio)}</td>
                                    <td className="px-4 py-3">
                                        {p.activo ? (
                                            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-200">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-stone-700 bg-stone-800 px-2 py-0.5 text-xs text-stone-300">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="px-3 py-2 rounded-lg border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => toggleActivo(p)}
                                                className={classNames(
                                                    'px-3 py-2 rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                                                    p.activo
                                                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                                                        : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30',
                                                )}
                                            >
                                                {p.activo ? 'Deshabilitar' : 'Habilitar'}
                                            </button>
                                            <button
                                                onClick={() => deleteProducto(p)}
                                                className="px-3 py-2 rounded-lg border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {productos.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-10 text-center text-stone-400" colSpan={6}>
                                        No hay productos aún.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {isOpen ? (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl p-6 relative">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="text-lg font-semibold">
                                        {draft.idProducto ? 'Editar producto' : 'Crear producto'}
                                    </div>
                                    <div className="mt-1 text-sm text-stone-400">
                                        Precio mínimo: $500 COP. Nombre único por categoría.
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="rounded-lg px-3 py-2 border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                >
                                    Cerrar
                                </button>
                            </div>

                            {error ? (
                                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </div>
                            ) : null}

                            <form className="mt-6 space-y-4" onSubmit={saveDraft}>
                                <div>
                                    <label className="block text-sm font-medium text-stone-400">Nombre</label>
                                    <input
                                        value={draft.nombreProducto}
                                        onChange={(e) => setDraft((d) => ({ ...d, nombreProducto: e.target.value }))}
                                        className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        placeholder="Ej: Arroz con Pollo"
                                        required
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-400">Precio (COP)</label>
                                        <input
                                            value={draft.precio}
                                            onChange={(e) => setDraft((d) => ({ ...d, precio: e.target.value }))}
                                            className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            placeholder="Ej: 18000"
                                            inputMode="numeric"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-400">Tipo</label>
                                        <select
                                            value={draft.tipo}
                                            onChange={(e) => setDraft((d) => ({ ...d, tipo: e.target.value }))}
                                            className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        >
                                            <option value="PLATO">PLATO</option>
                                            <option value="BEBIDA">BEBIDA</option>
                                            <option value="COMBO">COMBO</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-400">Categoría</label>
                                        <select
                                            value={draft.categoria_idCategoria}
                                            onChange={(e) => setDraft((d) => ({ ...d, categoria_idCategoria: e.target.value }))}
                                            className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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
                                        <label className="block text-sm font-medium text-stone-400">Estado</label>
                                        <select
                                            value={draft.activo ? '1' : '0'}
                                            onChange={(e) => setDraft((d) => ({ ...d, activo: e.target.value === '1' }))}
                                            className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        >
                                            <option value="1">Activo</option>
                                            <option value="0">Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-400">Descripción (opcional)</label>
                                    <textarea
                                        value={draft.descripcion}
                                        onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
                                        className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-24"
                                        placeholder="Ej: Plato típico, porción personal."
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg px-6 py-3 border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
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

