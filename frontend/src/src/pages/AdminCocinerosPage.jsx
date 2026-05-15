import React, { useEffect, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAlertError } from '../utils/adminAlerts';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function emptyDraft() {
    return {
        idUsuario: null,
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        correo: '',
        password: '',
        activo: true,
    };
}

export function AdminCocinerosPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cocineros, setCocineros] = useState([]);

    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState(emptyDraft());

    async function load() {
        setLoading(true);
        try {
            const data = await apiFetch('/api/admin/cocineros');
            setCocineros(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            void adminAlertError(err, 'No se pudieron cargar los cocineros');
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

    function openEdit(m) {
        setDraft({
            idUsuario: m.idUsuario,
            nombre: m.nombre ?? '',
            apellido: m.apellido ?? '',
            cedula: m.cedula ?? '',
            telefono: m.telefono ?? '',
            correo: m.correo ?? '',
            password: '',
            activo: Boolean(m.activo),
        });
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
        setDraft(emptyDraft());
    }

    async function saveDraft(e) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nombre: String(draft.nombre || '').trim(),
            apellido: String(draft.apellido || '').trim(),
            cedula: String(draft.cedula || '').trim(),
            telefono: String(draft.telefono || '').trim(),
            correo: String(draft.correo || '').trim(),
            activo: Boolean(draft.activo),
        };

        const password = String(draft.password || '').trim();
        if (draft.idUsuario) {
            if (password) payload.password = password;
        } else {
            payload.password = password;
        }

        try {
            if (draft.idUsuario) {
                await apiFetch(`/api/admin/cocineros/${draft.idUsuario}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch('/api/admin/cocineros', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            await load();
            closeModal();
        } catch (err) {
            void adminAlertError(err, 'No se pudo guardar el cocinero');
        } finally {
            setSaving(false);
        }
    }

    async function toggleActivo(m) {
        try {
            await apiFetch(`/api/admin/cocineros/${m.idUsuario}/activo`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: !m.activo }),
            });
            await load();
        } catch (err) {
            void adminAlertError(err, 'No se pudo cambiar el estado');
        }
    }

    if (loading) {
        return (
            <AdminLayout title="Cocineros">
                <div className="flex items-center justify-center text-stone-600 dark:text-stone-400 text-lg py-20">Cargando cocineros…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Cocineros">
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <div className="text-3xl font-semibold tracking-tight">Cocineros</div>
                    <div className="mt-2 text-stone-600 dark:text-stone-400">Crea, edita o deshabilita cocineros (sin eliminarlos).</div>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                    Crear cocinero
                </button>
            </div>

            <div className="mt-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-stone-600 dark:text-stone-400">
                            <tr className="border-b border-stone-200 dark:border-stone-800">
                                <th className="text-left font-medium px-4 py-3">Nombre</th>
                                <th className="text-left font-medium px-4 py-3">Correo</th>
                                <th className="text-left font-medium px-4 py-3">Teléfono</th>
                                <th className="text-left font-medium px-4 py-3">Estado</th>
                                <th className="text-right font-medium px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {cocineros.map((m) => (
                                <tr key={m.idUsuario} className="hover:bg-stone-100/70 dark:bg-stone-900/60">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {m.nombre} {m.apellido}
                                        </div>
                                        <div className="mt-0.5 text-stone-600 dark:text-stone-500">Cédula: {m.cedula}</div>
                                    </td>
                                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{m.correo}</td>
                                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{m.telefono}</td>
                                    <td className="px-4 py-3">
                                        {m.activo ? (
                                            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-200">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-700 dark:text-stone-300">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(m)}
                                                className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => toggleActivo(m)}
                                                className={classNames(
                                                    'px-3 py-2 rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                                                    m.activo
                                                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                                                        : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30',
                                                )}
                                            >
                                                {m.activo ? 'Deshabilitar' : 'Habilitar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {cocineros.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-10 text-center text-stone-600 dark:text-stone-400" colSpan={5}>
                                        No hay cocineros aún.
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
                        <div className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 relative">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="text-lg font-semibold">
                                        {draft.idUsuario ? 'Editar cocinero' : 'Crear cocinero'}
                                    </div>
                                    <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                                        {draft.idUsuario
                                            ? 'Si dejas la contraseña vacía, no se cambia.'
                                            : 'La contraseña es obligatoria al crear.'}
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="rounded-lg px-3 py-2 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                    type="button"
                                >
                                    Cerrar
                                </button>
                            </div>

                            <form className="mt-6 space-y-4" onSubmit={saveDraft}>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Nombre</label>
                                        <input
                                            value={draft.nombre}
                                            onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Apellido</label>
                                        <input
                                            value={draft.apellido}
                                            onChange={(e) => setDraft((d) => ({ ...d, apellido: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Cédula</label>
                                        <input
                                            value={draft.cedula}
                                            onChange={(e) => setDraft((d) => ({ ...d, cedula: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Teléfono</label>
                                        <input
                                            value={draft.telefono}
                                            onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Correo</label>
                                    <input
                                        value={draft.correo}
                                        onChange={(e) => setDraft((d) => ({ ...d, correo: e.target.value }))}
                                        className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">
                                            Contraseña {draft.idUsuario ? '(opcional)' : ''}
                                        </label>
                                        <input
                                            type="password"
                                            minLength={draft.idUsuario ? undefined : 6}
                                            value={draft.password}
                                            onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                                            className="mt-2 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            autoComplete="new-password"
                                            required={!draft.idUsuario}
                                        />
                                        {!draft.idUsuario ? (
                                            <p className="mt-1 text-xs text-stone-500">Mínimo 6 caracteres (requisito del sistema).</p>
                                        ) : (
                                            <p className="mt-1 text-xs text-stone-500">Si la cambias, mínimo 6 caracteres.</p>
                                        )}
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

