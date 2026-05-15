import React, { useEffect, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function emptyForm() {
    return { numero: '', nombre: '', capacidad: '4' };
}

function emptyEdit() {
    return { idMesa: null, numero: '', nombre: '', capacidad: '' };
}

function formatFechaHora(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

const ESTADO_PEDIDO = {
    PENDIENTE: 'Pendiente',
    EN_PREPARACION: 'En preparación',
    LISTO: 'Listo',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
};

export function AdminMesasPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mesas, setMesas] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm());

    const [editOpen, setEditOpen] = useState(false);
    const [edit, setEdit] = useState(emptyEdit());

    const [histOpen, setHistOpen] = useState(false);
    const [histMesa, setHistMesa] = useState(null);
    const [histRows, setHistRows] = useState([]);
    const [histLoading, setHistLoading] = useState(false);

    async function load() {
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch('/api/admin/mesas');
            setMesas(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            setError(err?.message || 'No se pudieron cargar las mesas.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function crearMesa(e) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await apiFetch('/api/admin/mesas', {
                method: 'POST',
                body: JSON.stringify({
                    numero: Number(form.numero),
                    nombre: form.nombre?.trim() || null,
                    capacidad: Number(form.capacidad),
                }),
            });
            setForm(emptyForm());
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo crear la mesa.');
        } finally {
            setSaving(false);
        }
    }

    function openEdit(m) {
        setEdit({
            idMesa: m.idMesa,
            numero: String(m.numero),
            nombre: m.nombre ?? '',
            capacidad: String(m.capacidad ?? ''),
        });
        setEditOpen(true);
    }

    function closeEdit() {
        setEditOpen(false);
        setEdit(emptyEdit());
        setError('');
    }

    async function guardarEdicion(ev) {
        ev.preventDefault();
        if (!edit.idMesa) return;
        setError('');
        setSaving(true);
        try {
            await apiFetch(`/api/admin/mesas/${edit.idMesa}`, {
                method: 'PUT',
                body: JSON.stringify({
                    numero: Number(edit.numero),
                    nombre: edit.nombre?.trim() || null,
                    capacidad: Number(edit.capacidad),
                }),
            });
            closeEdit();
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo guardar.');
        } finally {
            setSaving(false);
        }
    }

    async function toggleActiva(m) {
        setError('');
        try {
            await apiFetch(`/api/admin/mesas/${m.idMesa}/activo`, {
                method: 'PATCH',
                body: JSON.stringify({ activa: !m.activa }),
            });
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo actualizar.');
        }
    }

    async function eliminarMesa(m) {
        if (
            !window.confirm(
                `¿Eliminar la mesa "${m.nombre || `#${m.numero}`}"?\n\nSolo se permite si no tiene pedidos registrados.`,
            )
        ) {
            return;
        }
        setError('');
        try {
            await apiFetch(`/api/admin/mesas/${m.idMesa}`, { method: 'DELETE' });
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo eliminar.');
        }
    }

    async function abrirHistorial(m) {
        setHistMesa(m);
        setHistOpen(true);
        setHistRows([]);
        setHistLoading(true);
        setError('');
        try {
            const data = await apiFetch(`/api/admin/mesas/${m.idMesa}/historial`);
            setHistRows(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            setError(err?.message || 'No se pudo cargar el historial.');
        } finally {
            setHistLoading(false);
        }
    }

    function closeHistorial() {
        setHistOpen(false);
        setHistMesa(null);
        setHistRows([]);
    }

    if (loading) {
        return (
            <AdminLayout title="Mesas">
                <div className="flex items-center justify-center text-stone-600 dark:text-stone-400 text-lg py-20">Cargando mesas…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Mesas">
            <div className="max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Mesas del local</h1>
                    <p className="mt-2 text-stone-600 dark:text-stone-400">
                        Registra número, nombre visible y capacidad. El estado Libre/Ocupada lo actualiza el sistema al
                        abrir o cerrar cuentas desde el mesero.
                    </p>
                </div>

                {error ? (
                    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                ) : null}

                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4">Nueva mesa</h2>
                    <form onSubmit={crearMesa} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Número (único)</label>
                            <input
                                required
                                type="number"
                                min={1}
                                max={9999}
                                value={form.numero}
                                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                placeholder="Ej. 1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Nombre (opcional)</label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                placeholder="Ej. Ventana 2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Capacidad (personas)</label>
                            <input
                                required
                                type="number"
                                min={1}
                                max={99}
                                value={form.capacidad}
                                onChange={(e) => setForm((f) => ({ ...f, capacidad: e.target.value }))}
                                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-orange-700 hover:bg-orange-600 disabled:opacity-60 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            {saving ? 'Guardando…' : 'Registrar mesa'}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800">
                        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Mesas registradas</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                            <thead className="text-stone-600 dark:text-stone-400">
                                <tr className="border-b border-stone-200 dark:border-stone-800">
                                    <th className="text-left font-medium px-4 py-3">Número</th>
                                    <th className="text-left font-medium px-4 py-3">Nombre</th>
                                    <th className="text-left font-medium px-4 py-3">Capacidad</th>
                                    <th className="text-left font-medium px-4 py-3">Estado</th>
                                    <th className="text-left font-medium px-4 py-3">En sistema</th>
                                    <th className="text-right font-medium px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                {mesas.map((m) => (
                                    <tr key={m.idMesa} className="hover:bg-stone-100/70 dark:bg-stone-950/50">
                                        <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-50 tabular-nums">{m.numero}</td>
                                        <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{m.nombre || '—'}</td>
                                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{m.capacidad}</td>
                                        <td className="px-4 py-3">
                                            {m.estado === 'OCUPADA' ? (
                                                <span className="inline-flex rounded-full border border-orange-600/40 bg-orange-950/40 px-2 py-0.5 text-xs text-orange-200">
                                                    Ocupada
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-700 dark:text-stone-300">
                                                    Libre
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.activa ? (
                                                <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-200">
                                                    Activa
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-400">
                                                    Inactiva
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirHistorial(m)}
                                                    className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                                >
                                                    Ver historial
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(m)}
                                                    className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActiva(m)}
                                                    className={classNames(
                                                        'px-3 py-2 rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                                                        m.activa
                                                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                                                            : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30',
                                                    )}
                                                >
                                                    {m.activa ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarMesa(m)}
                                                    className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {mesas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-stone-600 dark:text-stone-500">
                                            No hay mesas. Crea la primera arriba.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editOpen ? (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
                    <div
                        className="w-full sm:max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 sm:rounded-xl rounded-t-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-mesa-title"
                    >
                        <h2 id="edit-mesa-title" className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4">
                            Editar mesa
                        </h2>
                        <form onSubmit={guardarEdicion} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Número</label>
                                <input
                                    required
                                    type="number"
                                    min={1}
                                    max={9999}
                                    value={edit.numero}
                                    onChange={(e) => setEdit((x) => ({ ...x, numero: e.target.value }))}
                                    className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Nombre</label>
                                <input
                                    type="text"
                                    value={edit.nombre}
                                    onChange={(e) => setEdit((x) => ({ ...x, nombre: e.target.value }))}
                                    className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Capacidad</label>
                                <input
                                    required
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={edit.capacidad}
                                    onChange={(e) => setEdit((x) => ({ ...x, capacidad: e.target.value }))}
                                    className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="flex-1 rounded-lg border border-stone-200 dark:border-stone-800 py-2.5 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 rounded-lg bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold py-2.5 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                >
                                    {saving ? 'Guardando…' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {histOpen ? (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
                    <div
                        className="w-full sm:max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 sm:rounded-xl rounded-t-2xl p-6 shadow-xl max-h-[85vh] flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hist-mesa-title"
                    >
                        <h2 id="hist-mesa-title" className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-1">
                            Historial de pedidos
                        </h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                            {histMesa ? `${histMesa.nombre || `Mesa ${histMesa.numero}`} · #${histMesa.numero}` : ''}
                        </p>
                        <div className="flex-1 overflow-y-auto min-h-0 border border-stone-200 dark:border-stone-800 rounded-lg">
                            {histLoading ? (
                                <p className="p-6 text-stone-600 dark:text-stone-500 text-sm">Cargando…</p>
                            ) : histRows.length === 0 ? (
                                <p className="p-6 text-stone-600 dark:text-stone-500 text-sm">No hay pedidos registrados en esta mesa.</p>
                            ) : (
                                <ul className="divide-y divide-stone-200 dark:divide-stone-800">
                                    {histRows.map((row) => (
                                        <li key={row.idPedido} className="px-4 py-3 text-sm">
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <span className="font-medium text-stone-900 dark:text-stone-50">Pedido #{row.idPedido}</span>
                                                <span className="text-xs text-stone-600 dark:text-stone-500">
                                                    {ESTADO_PEDIDO[row.estado] || row.estado}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                                                <div>
                                                    <span className="text-stone-600 dark:text-stone-500">Abierto: </span>
                                                    {formatFechaHora(row.creado_en)}
                                                </div>
                                                <div>
                                                    <span className="text-stone-600 dark:text-stone-500">Cerrado: </span>
                                                    {row.cerrado_en ? formatFechaHora(row.cerrado_en) : '—'}
                                                </div>
                                                {row.mesero ? (
                                                    <div>
                                                        <span className="text-stone-600 dark:text-stone-500">Mesero: </span>
                                                        {row.mesero}
                                                    </div>
                                                ) : null}
                                                {row.notas ? (
                                                    <div className="text-amber-200/90 pt-1">Nota: {row.notas}</div>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={closeHistorial}
                            className="mt-4 w-full rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-700 text-stone-900 dark:text-stone-50 py-2.5 font-medium border border-stone-200 dark:border-stone-800"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    );
}
