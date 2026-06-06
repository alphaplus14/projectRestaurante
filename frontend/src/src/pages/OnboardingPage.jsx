import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { tenantAppOrigin } from '../tenancy/tenantContext';

function cleanTokenParam(raw) {
    if (!raw) return '';
    try {
        return decodeURIComponent(String(raw).trim()).split(/[?#]/)[0];
    } catch {
        return String(raw).trim().split(/[?#]/)[0];
    }
}

export function OnboardingPage() {
    const { token: rawToken } = useParams();
    const token = useMemo(() => cleanTokenParam(rawToken), [rawToken]);

    const [meta, setMeta] = useState(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);

    const [form, setForm] = useState({
        nombre_comercial: '',
        nit_o_documento: '',
        telefono: '',
        direccion: '',
        admin_nombre: '',
        admin_apellido: '',
        admin_correo: '',
        admin_password: '',
        admin_cedula: '',
        admin_telefono: '',
    });
    const [logo, setLogo] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');
            setReason('');
            setMeta(null);

            if (!token) {
                setError('Enlace incompleto. Abre el URL completo que llegó en el correo.');
                setLoading(false);
                return;
            }

            try {
                const res = await masterApiFetch(`/api/master/onboarding/${encodeURIComponent(token)}`);
                if (cancelled) return;

                const data = res?.data ?? null;
                setMeta(data);
                setReason(res?.reason || 'ready');
                setForm((f) => ({ ...f, admin_correo: data?.email || f.admin_correo }));
            } catch (e) {
                if (cancelled) return;
                const data = e?.data;
                setReason(data?.reason || 'error');
                setMeta(data?.data ?? data ?? null);
                setError(e?.message || 'No se pudo validar el enlace.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [token]);

    function onChange(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const body = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v != null && String(v).trim() !== '') {
                    body.append(k, String(v).trim());
                }
            });
            if (logo) {
                body.append('logo', logo);
            }

            const res = await masterApiFetch(`/api/master/onboarding/${encodeURIComponent(token)}`, {
                method: 'POST',
                body,
            });
            setDone(res?.data ?? { tenant_url: meta?.slug ? tenantAppOrigin(meta.slug) : '/' });
        } catch (err) {
            setError(err?.message || 'No se pudo guardar la configuración.');
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <p className="text-sm text-stone-600 dark:text-stone-400">Cargando configuración…</p>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl border border-emerald-500/30 bg-white dark:bg-stone-900 p-6 text-center space-y-4">
                    <h1 className="text-xl font-semibold text-emerald-800 dark:text-emerald-300">¡Listo!</h1>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        Tu restaurante quedó configurado. Entra desde tu subdominio:
                    </p>
                    <a
                        href={done.tenant_url}
                        className="block text-violet-700 dark:text-violet-400 font-medium break-all"
                    >
                        {done.tenant_url}
                    </a>
                    <button
                        type="button"
                        onClick={() => window.location.assign(done.admin_login || done.tenant_url + '/login-admin')}
                        className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-3 text-sm"
                    >
                        Ir al panel de administración
                    </button>
                </div>
            </div>
        );
    }

    if (reason === 'already_active' && meta?.tenant_url) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4 text-center">
                    <h1 className="text-xl font-semibold">Restaurante ya activo</h1>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        Este enlace ya se usó y el local está listo. Entra directamente:
                    </p>
                    <a href={meta.tenant_url} className="block text-violet-700 dark:text-violet-400 font-medium break-all">
                        {meta.tenant_url}
                    </a>
                    <button
                        type="button"
                        onClick={() => window.location.assign(meta.admin_login || meta.tenant_url + '/login-admin')}
                        className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-3 text-sm"
                    >
                        Ir al login de administración
                    </button>
                </div>
            </div>
        );
    }

    if (reason === 'used' || reason === 'expired' || reason === 'invalid' || (error && !meta)) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-white dark:bg-stone-900 p-6 space-y-3">
                    <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">Enlace no disponible</h1>
                    <p className="text-sm text-stone-700 dark:text-stone-300">{error}</p>
                    <p className="text-xs text-stone-500">
                        En Master, abre el restaurante y pulsa <strong>Reenviar correo</strong> para obtener un enlace
                        nuevo. Usa el último correo recibido.
                    </p>
                    <p className="text-xs text-stone-500">
                        Abre el enlace en el mismo PC donde corre el proyecto (
                        <code className="text-violet-600">npm run dev</code> en puerto 5173).
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 py-8 px-4">
            <div className="mx-auto max-w-lg space-y-6">
                <header>
                    <p className="text-xs uppercase tracking-wider text-stone-500">Configuración inicial</p>
                    <h1 className="text-2xl font-semibold">Tu restaurante</h1>
                    {meta ? (
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            Subdominio: <strong>{meta.subdomain}</strong>
                        </p>
                    ) : null}
                </header>

                {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold">Datos del local</legend>
                        <input
                            name="nombre_comercial"
                            required
                            placeholder="Nombre comercial *"
                            value={form.nombre_comercial}
                            onChange={onChange}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                        />
                        <input
                            name="nit_o_documento"
                            placeholder="NIT / documento"
                            value={form.nit_o_documento}
                            onChange={onChange}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                        />
                        <input
                            name="telefono"
                            placeholder="Teléfono"
                            value={form.telefono}
                            onChange={onChange}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                        />
                        <input
                            name="direccion"
                            placeholder="Dirección"
                            value={form.direccion}
                            onChange={onChange}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                        />
                        <label className="block text-sm">
                            <span className="text-stone-500">Logo (opcional)</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                                className="mt-1 w-full text-sm"
                            />
                        </label>
                    </fieldset>

                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold">Administrador inicial</legend>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                name="admin_nombre"
                                required
                                placeholder="Nombre *"
                                value={form.admin_nombre}
                                onChange={onChange}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                            />
                            <input
                                name="admin_apellido"
                                required
                                placeholder="Apellido *"
                                value={form.admin_apellido}
                                onChange={onChange}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                            />
                        </div>
                        <input
                            name="admin_correo"
                            type="email"
                            required
                            placeholder="Correo admin *"
                            value={form.admin_correo}
                            onChange={onChange}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                        />
                        <input
                            name="admin_password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="Contraseña (mín. 8) *"
                            value={form.admin_password}
                            onChange={onChange}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                        />
                    </fieldset>

                    <button
                        type="submit"
                        disabled={busy || !meta}
                        className="w-full rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-3 text-sm disabled:opacity-50"
                    >
                        {busy ? 'Creando tu base de datos…' : 'Activar restaurante'}
                    </button>
                    <p className="text-xs text-center text-stone-500">
                        Se creará una base de datos dedicada para tu local. Puede tardar unos segundos.
                    </p>
                </form>
            </div>
        </div>
    );
}
