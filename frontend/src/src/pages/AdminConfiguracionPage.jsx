import React, { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';

function formatFecha(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

/** SweetAlert2 con estética acorde al panel (dark + CTA naranja) */
function swalTheme(partial) {
    return Swal.mixin({
        background: '#1c1917',
        color: '#fafaf9',
        confirmButtonColor: '#c2410c',
        cancelButtonColor: '#44403c',
        buttonsStyling: true,
        customClass: {
            popup: 'rounded-xl border border-stone-800',
            title: 'text-stone-50',
            htmlContainer: 'text-stone-300 text-left',
        },
        ...partial,
    });
}

export function AdminConfiguracionPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [nombre, setNombre] = useState('');
    const [nit, setNit] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [logoUrl, setLogoUrl] = useState(null);
    const [actualizadoEn, setActualizadoEn] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const nombreInicial = useRef('');

    const [modalNombre, setModalNombre] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [modalError, setModalError] = useState('');

    const load = useCallback(async (opts = {}) => {
        const silent = Boolean(opts.silent);
        if (!silent) {
            setError('');
            setLoading(true);
        }
        try {
            const res = await apiFetch('/api/admin/restaurante-config');
            const d = res?.data;
            if (d) {
                setNombre(d.nombre_comercial ?? '');
                setNit(d.nit_o_documento ?? '');
                setTelefono(d.telefono ?? '');
                setDireccion(d.direccion ?? '');
                setLogoUrl(d.logoUrl ?? null);
                setActualizadoEn(d.actualizado_en ?? null);
                nombreInicial.current = String(d.nombre_comercial ?? '').trim();
            }
        } catch (err) {
            const msg = err?.message || 'No se pudo cargar la configuración.';
            if (silent) {
                await swalTheme({ icon: 'warning', title: 'No se pudo recargar', text: msg }).fire();
            } else {
                setError(msg);
            }
        } finally {
            setLogoFile(null);
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!logoFile) {
            setLogoPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }
        const url = URL.createObjectURL(logoFile);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [logoFile]);

    function onPickLogo(e) {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setLogoFile(f);
    }

    function notificarMarcaActualizada() {
        try {
            window.dispatchEvent(new CustomEvent('napa:config-actualizada'));
        } catch {
            /* ignore */
        }
    }

    async function enviarGuardado(passwordActual) {
        setSaving(true);
        setError('');
        setModalError('');
        try {
            const hasFile = logoFile instanceof File;
            const nombreTrim = nombre.trim();
            const nombreCambio = nombreTrim !== nombreInicial.current;

            if (hasFile) {
                const fd = new FormData();
                fd.append('nombre_comercial', nombreTrim);
                fd.append('nit_o_documento', nit.trim() || '');
                fd.append('telefono', telefono.trim() || '');
                fd.append('direccion', direccion.trim() || '');
                if (nombreCambio) {
                    fd.append('password_actual', passwordActual || '');
                }
                fd.append('logo', logoFile);
                await apiFetch('/api/admin/restaurante-config', { method: 'POST', body: fd });
            } else {
                const body = {
                    nombre_comercial: nombreTrim,
                    nit_o_documento: nit.trim() || null,
                    telefono: telefono.trim() || null,
                    direccion: direccion.trim() || null,
                };
                if (nombreCambio) {
                    body.password_actual = passwordActual || '';
                }
                await apiFetch('/api/admin/restaurante-config', {
                    method: 'PUT',
                    body: JSON.stringify(body),
                });
            }

            setLogoFile(null);
            setPasswordConfirm('');
            setModalNombre(false);
            nombreInicial.current = nombreTrim;

            await load({ silent: true });
            notificarMarcaActualizada();

            await swalTheme({
                icon: 'success',
                title: 'Cambios guardados',
                text: 'La configuración del restaurante se actualizó correctamente.',
            }).fire();
        } catch (err) {
            const msg = err?.message || 'No se pudo guardar.';
            const esPassword = /contraseña|password|inválid/i.test(msg);

            if (modalNombre || nombre.trim() !== nombreInicial.current) {
                setModalError(msg);
            }

            await swalTheme({
                icon: esPassword ? 'error' : 'error',
                title: esPassword ? 'Contraseña incorrecta' : 'No se pudo guardar',
                text: msg,
            }).fire();
        } finally {
            setSaving(false);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const nombreTrim = nombre.trim();
        if (!nombreTrim) {
            void swalTheme({
                icon: 'warning',
                title: 'Falta el nombre',
                text: 'El nombre comercial es obligatorio.',
            }).fire();
            return;
        }

        if (nombreTrim !== nombreInicial.current) {
            setPasswordConfirm('');
            setModalError('');
            setModalNombre(true);
            return;
        }

        void enviarGuardado('');
    }

    function confirmarCambioNombre() {
        setModalError('');
        const p = passwordConfirm.trim();
        if (!p) {
            void swalTheme({
                icon: 'info',
                title: 'Contraseña requerida',
                text: 'Escribe la contraseña de tu usuario administrador para confirmar el cambio de nombre.',
            }).fire();
            setModalError('Escribe tu contraseña para continuar.');
            return;
        }
        void enviarGuardado(p);
    }

    if (loading) {
        return (
            <AdminLayout title="Configuración">
                <div className="flex items-center justify-center text-stone-400 py-20">Cargando…</div>
            </AdminLayout>
        );
    }

    const previewSrc = logoPreview || logoUrl;

    return (
        <AdminLayout title="Configuración">
            <div className="max-w-2xl space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold text-stone-50 tracking-tight">Configuración del restaurante</h1>
                    <p className="mt-2 text-stone-400 text-sm leading-relaxed">
                        Datos que identifican tu local (HU25). El nombre y el logo se muestran en la barra lateral del
                        panel. Si cambias el nombre comercial, el sistema pedirá tu contraseña para evitar cambios no
                        deseados.
                    </p>
                    {actualizadoEn ? (
                        <p className="mt-2 text-xs text-stone-500">Última actualización en servidor: {formatFecha(actualizadoEn)}</p>
                    ) : null}
                </div>

                {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
                        <h2 className="text-base font-semibold text-stone-50 border-b border-stone-800 pb-3">Identidad</h2>

                        <div>
                            <label className="block text-xs font-medium text-stone-400 mb-1.5" htmlFor="cfg-nombre">
                                Nombre comercial
                            </label>
                            <input
                                id="cfg-nombre"
                                type="text"
                                required
                                maxLength={160}
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 text-stone-50 rounded-lg px-4 py-2.5 text-sm placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                placeholder="Ej. Ñapa Cocina"
                            />
                            <p className="mt-1.5 text-xs text-stone-500">Visible en el panel administrador (barra lateral).</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-400 mb-1.5">Logo</label>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="h-20 w-20 rounded-xl border border-stone-800 bg-stone-950 overflow-hidden flex items-center justify-center shrink-0">
                                    {previewSrc ? (
                                        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-stone-500 text-xs text-center px-1">Sin logo</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={onPickLogo}
                                        className="block w-full text-sm text-stone-400 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-stone-950 hover:file:bg-amber-500"
                                    />
                                    <p className="text-xs text-stone-500">JPG, PNG, WebP o GIF · máx. 5 MB. Reemplaza el logo anterior.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
                        <h2 className="text-base font-semibold text-stone-50 border-b border-stone-800 pb-3">Datos del negocio</h2>
                        <p className="text-xs text-stone-500 -mt-2">
                            NIT, teléfono y dirección se usan en cuentas e impresiones según lo definido en el proyecto.
                        </p>

                        <div>
                            <label className="block text-xs font-medium text-stone-400 mb-1.5" htmlFor="cfg-nit">
                                NIT o documento
                            </label>
                            <input
                                id="cfg-nit"
                                type="text"
                                maxLength={40}
                                value={nit}
                                onChange={(e) => setNit(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 text-stone-50 rounded-lg px-4 py-2.5 text-sm placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                placeholder="Opcional"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-400 mb-1.5" htmlFor="cfg-tel">
                                Teléfono
                            </label>
                            <input
                                id="cfg-tel"
                                type="tel"
                                maxLength={40}
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 text-stone-50 rounded-lg px-4 py-2.5 text-sm placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                placeholder="Opcional"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-400 mb-1.5" htmlFor="cfg-dir">
                                Dirección / ubicación
                            </label>
                            <textarea
                                id="cfg-dir"
                                rows={3}
                                maxLength={255}
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 text-stone-50 rounded-lg px-4 py-2.5 text-sm placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 resize-y min-h-[88px]"
                                placeholder="Calle, ciudad, referencias…"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => void load()}
                            disabled={saving}
                            className="rounded-lg border border-stone-800 px-5 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-900 disabled:opacity-50"
                        >
                            Descartar cambios
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold px-6 py-2.5 text-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            {saving ? 'Guardando…' : 'Guardar configuración'}
                        </button>
                    </div>
                </form>
            </div>

            {modalNombre ? (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
                    <div
                        className="w-full sm:max-w-md bg-stone-900 border border-stone-800 sm:rounded-xl rounded-t-2xl p-6 shadow-xl relative z-[101]"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-nombre-title"
                    >
                        <h2 id="modal-nombre-title" className="text-lg font-semibold text-stone-50">
                            Confirmar cambio de nombre
                        </h2>
                        <p className="mt-3 text-sm text-stone-400 leading-relaxed">
                            Vas a cambiar el nombre comercial de <span className="text-stone-300">«{nombreInicial.current}»</span> a{' '}
                            <span className="text-stone-300">«{nombre.trim()}»</span>. Esto se verá en todo el panel de administración.
                            Por seguridad, escribe la contraseña de tu usuario administrador.
                        </p>
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-stone-400 mb-1.5" htmlFor="cfg-pass">
                                Contraseña de administrador
                            </label>
                            <input
                                id="cfg-pass"
                                type="password"
                                autoComplete="current-password"
                                value={passwordConfirm}
                                onChange={(e) => {
                                    setPasswordConfirm(e.target.value);
                                    setModalError('');
                                }}
                                className="w-full bg-stone-950 border border-stone-800 text-stone-50 rounded-lg px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            />
                        </div>
                        {modalError ? (
                            <p className="mt-3 text-sm text-red-400 border border-red-500/30 bg-red-950/30 rounded-lg px-3 py-2">{modalError}</p>
                        ) : null}
                        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                    setModalNombre(false);
                                    setPasswordConfirm('');
                                    setModalError('');
                                }}
                                className="rounded-lg border border-stone-800 px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-800/60"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void confirmarCambioNombre()}
                                className="rounded-lg bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold px-4 py-2.5 text-sm disabled:opacity-60"
                            >
                                {saving ? 'Guardando…' : 'Sí, cambiar nombre'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    );
}
