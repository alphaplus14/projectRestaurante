import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminTwoFactorPanel } from '../components/AdminTwoFactorPanel';
<<<<<<< HEAD
=======
import { AdminSubscriptionPanel } from '../components/AdminSubscriptionPanel';
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
import { adminAlertError } from '../utils/adminAlerts';

function formatFecha(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

const READONLY_FIELD_CLASS =
    'w-full cursor-not-allowed rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-200/60 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 px-4 py-2.5 text-sm opacity-90';

export function AdminConfiguracionPage() {
    const [loading, setLoading] = useState(true);

    const [nombre, setNombre] = useState('');
    const [nit, setNit] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [logoUrl, setLogoUrl] = useState(null);
    const [actualizadoEn, setActualizadoEn] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
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
            }
        } catch (err) {
            void adminAlertError(err, 'Configuración');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    if (loading) {
        return (
            <AdminLayout title="Configuración">
                <div className="flex items-center justify-center text-stone-600 dark:text-stone-400 py-20">Cargando…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Configuración">
            <div className="max-w-2xl space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">Configuración del restaurante</h1>
                    <p className="mt-2 text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
                        Datos de identidad de tu local (HU25). Se muestran aquí y en la barra lateral del panel. Están
                        definidos al activar tu licencia y no pueden modificarse desde este panel; si necesitas un
                        cambio, contacta a soporte del proveedor del software.
                    </p>
                    {actualizadoEn ? (
                        <p className="mt-2 text-xs text-stone-600 dark:text-stone-500">Última actualización en servidor: {formatFecha(actualizadoEn)}</p>
                    ) : null}
                </div>

                <div className="space-y-8">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
                        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 border-b border-stone-200 dark:border-stone-800 pb-3">Identidad</h2>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5" htmlFor="cfg-nombre">
                                Nombre comercial
                            </label>
                            <input
                                id="cfg-nombre"
                                type="text"
                                readOnly
                                disabled
                                value={nombre}
                                className={READONLY_FIELD_CLASS}
                                aria-describedby="cfg-nombre-hint"
                            />
                            <p id="cfg-nombre-hint" className="mt-1.5 text-xs text-stone-600 dark:text-stone-500">
                                Visible en el panel administrador (barra lateral).
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Logo</label>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="h-20 w-20 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 overflow-hidden flex items-center justify-center shrink-0">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-stone-600 dark:text-stone-500 text-xs text-center px-1">Sin logo</span>
                                    )}
                                </div>
                                <p className="text-xs text-stone-600 dark:text-stone-500 sm:pt-2">
                                    Imagen asignada a tu instalación. No se puede reemplazar desde el panel de administración.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
                        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 border-b border-stone-200 dark:border-stone-800 pb-3">Datos del negocio</h2>
                        <p className="text-xs text-stone-600 dark:text-stone-500 -mt-2">
                            NIT, teléfono y dirección son datos fijos de tu licencia.
                        </p>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5" htmlFor="cfg-nit">
                                NIT o documento
                            </label>
                            <input
                                id="cfg-nit"
                                type="text"
                                readOnly
                                disabled
                                value={nit}
                                className={READONLY_FIELD_CLASS}
                                aria-describedby="cfg-nit-hint"
                            />
                            <p id="cfg-nit-hint" className="mt-1.5 text-xs text-stone-600 dark:text-stone-500">
                                Dato fijo de tu instalación. Si necesitas corregirlo, contacta a soporte del proveedor del software.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5" htmlFor="cfg-tel">
                                Teléfono
                            </label>
                            <input
                                id="cfg-tel"
                                type="tel"
                                readOnly
                                disabled
                                value={telefono || '—'}
                                className={READONLY_FIELD_CLASS}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5" htmlFor="cfg-dir">
                                Dirección / ubicación
                            </label>
                            <textarea
                                id="cfg-dir"
                                rows={3}
                                readOnly
                                disabled
                                value={direccion || '—'}
                                className={`${READONLY_FIELD_CLASS} resize-none min-h-[88px]`}
                            />
                        </div>
                    </div>

                    <AdminTwoFactorPanel />
<<<<<<< HEAD
=======

                    <AdminSubscriptionPanel />
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                </div>
            </div>
        </AdminLayout>
    );
}
