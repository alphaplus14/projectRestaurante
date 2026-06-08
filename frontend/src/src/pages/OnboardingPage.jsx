import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { setDevTenantSlug, tenantAppOrigin } from '../tenancy/tenantContext';
import { PasswordInput } from '../components/PasswordInput';

const STEPS = [
    { id: 1, title: 'Tu local' },
    { id: 2, title: 'Administrador' },
    { id: 3, title: 'Confirmar' },
];

const LOGO_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LogoUploadField({ file, previewUrl, error, onSelect, onClear }) {
    const inputId = useId();
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    function validateAndSelect(nextFile) {
        if (!nextFile) return;

        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(nextFile.type)) {
            onSelect(null, 'Formato no válido. Usa JPG, PNG o WebP.');
            return;
        }

        onSelect(nextFile, null);
    }

    function onInputChange(e) {
        validateAndSelect(e.target.files?.[0] ?? null);
        e.target.value = '';
    }

    function onDrop(e) {
        e.preventDefault();
        setDragOver(false);
        validateAndSelect(e.dataTransfer.files?.[0] ?? null);
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor={inputId} className="text-sm font-medium text-stone-800 dark:text-stone-200">
                    Logo de tu restaurante
                </label>
                <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                    Opcional
                </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
                Aparecerá en el panel de administración y en la carta que ven tus clientes. JPG, PNG o WebP.
            </p>

            <div
                className={[
                    'rounded-xl border-2 border-dashed p-4 transition-colors',
                    dragOver
                        ? 'border-violet-500 bg-violet-50/80 dark:bg-violet-950/30'
                        : error
                          ? 'border-red-400/70 bg-red-50/50 dark:bg-red-950/20'
                          : file
                            ? 'border-violet-400/50 bg-violet-50/40 dark:bg-violet-950/20'
                            : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/50',
                ].join(' ')}
                onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={onDrop}
            >
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    <div
                        className={[
                            'h-24 w-24 shrink-0 rounded-xl border overflow-hidden flex items-center justify-center',
                            file
                                ? 'border-violet-300 dark:border-violet-700 bg-white dark:bg-stone-900'
                                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900',
                        ].join(' ')}
                        aria-hidden={!previewUrl}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Vista previa del logo" className="h-full w-full object-contain p-1" />
                        ) : (
                            <svg className="h-10 w-10 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
                                <path d="M21 15l-5-5L5 19" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1 w-full text-center sm:text-left space-y-3">
                        {file ? (
                            <>
                                <div>
                                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200 break-all">{file.name}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">{formatFileSize(file.size)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
                                    >
                                        Cambiar imagen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClear}
                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-stone-700 dark:text-stone-300">
                                    Arrastra tu logo aquí o búscalo en tu dispositivo
                                </p>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white px-4 py-2 text-sm font-semibold"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Elegir imagen
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={LOGO_ACCEPT}
                onChange={onInputChange}
                className="sr-only"
            />

            {error ? (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

function cleanTokenParam(raw) {
    if (!raw) return '';
    try {
        return decodeURIComponent(String(raw).trim()).split(/[?#]/)[0];
    } catch {
        return String(raw).trim().split(/[?#]/)[0];
    }
}

function StepIndicator({ current }) {
    return (
        <ol className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
            {STEPS.map((s) => {
                const active = s.id === current;
                const done = s.id < current;
                return (
                    <li key={s.id} className="flex items-center gap-1.5 sm:gap-2">
                        <span
                            className={[
                                'flex h-7 w-7 items-center justify-center rounded-full font-semibold border',
                                done
                                    ? 'bg-violet-600 border-violet-600 text-white'
                                    : active
                                      ? 'border-violet-600 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40'
                                      : 'border-stone-300 dark:border-stone-700 text-stone-500',
                            ].join(' ')}
                        >
                            {done ? '✓' : s.id}
                        </span>
                        <span className={active ? 'font-medium text-stone-900 dark:text-stone-100' : 'text-stone-500 hidden sm:inline'}>
                            {s.title}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function buildSummaryEmailNote(data) {
    if (!data) return '';
    if (data.summary_email_sent) {
        const correo = data.admin_correo || 'tu correo';
        return `Enviamos un resumen a ${correo} para que guardes los accesos y próximos pasos.`;
    }
    if (data.summary_email_error) {
        return 'No pudimos enviar el correo de resumen. Guarda esta pantalla o copia los enlaces de abajo.';
    }
    return '';
}

function OnboardingSuccess({ done, meta, onGoAdmin, summaryEmailNote }) {
    const slug = done.slug || meta?.slug;
    const checklist = [
        {
            title: 'Entrar al panel de administración',
            desc: `Correo: ${done.admin_correo || meta?.email || 'el que definiste'}. Usa la contraseña que acabas de crear.`,
            action: 'Ir al panel admin',
            onClick: onGoAdmin,
            primary: true,
        },
        {
            title: 'Configura tu carta',
            desc: 'En Admin → Productos, crea categorías y platos que verán tus clientes.',
            href: done.tenant_url ? `${done.tenant_url}/admin/productos` : null,
        },
        {
            title: 'Crea mesas y personal',
            desc: 'Registra mesas, meseros, cocineros y cajeros desde el panel.',
            href: done.staff_url,
            label: 'Portal del personal',
        },
        {
            title: 'Comparte el sitio público',
            desc: 'Tus comensales pueden ver la carta y reservar desde aquí.',
            href: done.cliente_url,
            label: done.cliente_url || 'Sitio para clientes',
        },
    ];

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
            <div className="max-w-lg w-full rounded-2xl border border-emerald-500/30 bg-white dark:bg-stone-900 p-6 space-y-5">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">¡Tu restaurante está listo!</h1>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        <strong>{done.nombre_comercial || meta?.nombre_comercial || slug}</strong> quedó activo.
                    </p>
                    {done.tenant_url ? (
                        <a href={done.tenant_url} className="text-sm text-violet-700 dark:text-violet-400 font-medium break-all">
                            {done.tenant_url}
                        </a>
                    ) : null}
                    {summaryEmailNote ? (
                        <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">{summaryEmailNote}</p>
                    ) : null}
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Próximos pasos</p>
                    <ul className="space-y-3">
                        {checklist.map((item, i) => (
                            <li key={i} className="text-sm space-y-1">
                                <p className="font-medium text-stone-800 dark:text-stone-200">
                                    {i + 1}. {item.title}
                                </p>
                                <p className="text-xs text-stone-600 dark:text-stone-400">{item.desc}</p>
                                {item.onClick ? (
                                    <button
                                        type="button"
                                        onClick={item.onClick}
                                        className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-300 underline"
                                    >
                                        {item.action}
                                    </button>
                                ) : item.href ? (
                                    <a href={item.href} className="mt-1 block text-xs font-medium text-violet-700 dark:text-violet-400 break-all">
                                        {item.label}
                                    </a>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    type="button"
                    onClick={onGoAdmin}
                    className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-3 text-sm"
                >
                    Empezar en el panel de administración
                </button>
            </div>
        </div>
    );
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
    const [step, setStep] = useState(1);

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
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoError, setLogoError] = useState('');

    const loadMeta = useCallback(async () => {
        if (!token) {
            setError('Enlace incompleto. Abre el URL completo que llegó en el correo.');
            setLoading(false);
            return;
        }

        try {
            const res = await masterApiFetch(`/api/master/onboarding/${encodeURIComponent(token)}`);
            const data = res?.data ?? null;
            setMeta(data);
            setReason(res?.reason || 'ready');
            setError('');
            setForm((f) => ({
                ...f,
                admin_correo: data?.email || f.admin_correo,
            }));

            if (res?.reason === 'provisioning') {
                setBusy(true);
            }
        } catch (e) {
            const data = e?.data;
            setReason(data?.reason || 'error');
            setMeta(data?.data ?? data ?? null);
            setError(e?.message || 'No se pudo validar el enlace.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        void loadMeta();
    }, [loadMeta]);

    useEffect(() => {
        if (!logo) {
            setLogoPreview(null);
            return undefined;
        }
        const url = URL.createObjectURL(logo);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [logo]);

    useEffect(() => {
        if (reason !== 'provisioning' || !token) return undefined;

        const id = setInterval(() => {
            void loadMeta().then(() => {
                /* loadMeta sets reason */
            });
        }, 3000);

        return () => clearInterval(id);
    }, [reason, token, loadMeta]);

    useEffect(() => {
        if (reason === 'provisioning') return;
        setBusy(false);
    }, [reason]);

    function onChange(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function goAdmin(doneData) {
        const slug = doneData?.slug || meta?.slug;
        if (slug) setDevTenantSlug(slug);
        window.location.assign(doneData?.admin_login || (slug ? tenantAppOrigin(slug) + '/staff?rol=admin' : '/staff?rol=admin'));
    }

    async function onSubmit() {
        setBusy(true);
        setError('');
        try {
            const body = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v != null && String(v).trim() !== '') {
                    body.append(k, String(v).trim());
                }
            });
            if (logo) body.append('logo', logo);

            const res = await masterApiFetch(`/api/master/onboarding/${encodeURIComponent(token)}`, {
                method: 'POST',
                body,
            });
            const slug = meta?.slug || res?.data?.slug;
            if (slug) setDevTenantSlug(slug);
            setDone(res?.data ?? { tenant_url: slug ? tenantAppOrigin(slug) : '/' });
            setReason('done');
        } catch (err) {
            if (err?.data?.reason === 'provisioning') {
                setReason('provisioning');
            } else {
                setError(err?.message || 'No se pudo guardar la configuración.');
            }
        } finally {
            setBusy(false);
        }
    }

    function canAdvanceStep() {
        if (step === 1) return String(form.nombre_comercial).trim().length > 0;
        if (step === 2) {
            return (
                String(form.admin_nombre).trim() &&
                String(form.admin_apellido).trim() &&
                String(form.admin_correo).trim() &&
                String(form.admin_password).length >= 8
            );
        }
        return true;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <p className="text-sm text-stone-600 dark:text-stone-400">Validando tu enlace…</p>
            </div>
        );
    }

    if (done || reason === 'done') {
        return (
            <OnboardingSuccess
                done={done || {}}
                meta={meta}
                onGoAdmin={() => goAdmin(done)}
                summaryEmailNote={buildSummaryEmailNote(done)}
            />
        );
    }

    if (reason === 'provisioning') {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl border border-violet-500/30 bg-white dark:bg-stone-900 p-6 text-center space-y-4">
                    <div className="mx-auto h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" aria-hidden />
                    <h1 className="text-lg font-semibold">Creando tu restaurante…</h1>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        Estamos preparando la base de datos y tu usuario administrador. No cierres esta ventana.
                    </p>
                    {meta?.subdomain ? (
                        <p className="text-xs text-stone-500">
                            Subdominio: <strong>{meta.subdomain}</strong>
                        </p>
                    ) : null}
                </div>
            </div>
        );
    }

    if (reason === 'already_active' && meta?.tenant_url) {
        return (
            <OnboardingSuccess
                done={{
                    tenant_url: meta.tenant_url,
                    admin_login: meta.admin_login,
                    cliente_url: meta.cliente_url,
                    staff_url: meta.staff_url,
                    nombre_comercial: meta.nombre_comercial,
                    slug: meta.slug,
                    admin_correo: meta.email,
                }}
                meta={meta}
                onGoAdmin={() => goAdmin(meta)}
            />
        );
    }

    if (reason === 'used' || reason === 'expired' || reason === 'invalid' || (error && !meta)) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-white dark:bg-stone-900 p-6 space-y-3">
                    <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">Enlace no disponible</h1>
                    <p className="text-sm text-stone-700 dark:text-stone-300">{error}</p>
                    <p className="text-xs text-stone-500">
                        Pide a quien te invitó que abra <strong>Master</strong> y pulse <strong>Reenviar correo</strong>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 py-8 px-4">
            <div className="mx-auto max-w-lg space-y-6">
                <header className="text-center space-y-3">
                    <p className="text-xs uppercase tracking-wider text-stone-500">Bienvenido</p>
                    <h1 className="text-2xl font-semibold">Configura tu restaurante</h1>
                    {meta ? (
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            Tu sitio será <strong className="text-violet-700 dark:text-violet-400">{meta.subdomain}</strong>
                        </p>
                    ) : null}
                    <StepIndicator current={step} />
                </header>

                {reason === 'failed' && meta?.provision_error ? (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        <p className="font-medium">El intento anterior falló</p>
                        <p className="text-xs mt-1 opacity-90">{meta.provision_error}</p>
                        <p className="text-xs mt-2">Completa el formulario de nuevo para reintentar.</p>
                    </div>
                ) : null}

                {error ? <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p> : null}

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
                    {step === 1 ? (
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-semibold mb-1">Paso 1 — Datos del local</legend>
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
                            <LogoUploadField
                                file={logo}
                                previewUrl={logoPreview}
                                error={logoError}
                                onSelect={(nextFile, err) => {
                                    setLogo(nextFile);
                                    setLogoError(err || '');
                                }}
                                onClear={() => {
                                    setLogo(null);
                                    setLogoError('');
                                }}
                            />
                        </fieldset>
                    ) : null}

                    {step === 2 ? (
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-semibold mb-1">Paso 2 — Tu cuenta de administrador</legend>
                            <p className="text-xs text-stone-500">
                                Con este usuario entrarás al panel para crear productos, mesas y personal.
                            </p>
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
                            <PasswordInput
                                name="admin_password"
                                required
                                minLength={8}
                                placeholder="Contraseña (mín. 8 caracteres) *"
                                value={form.admin_password}
                                onChange={onChange}
                                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                            />
                            <input
                                name="admin_cedula"
                                placeholder="Cédula (opcional)"
                                value={form.admin_cedula}
                                onChange={onChange}
                                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950 text-sm"
                            />
                        </fieldset>
                    ) : null}

                    {step === 3 ? (
                        <div className="space-y-3 text-sm">
                            <p className="font-semibold">Paso 3 — Revisa y confirma</p>
                            <dl className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-200 dark:divide-stone-800">
                                <div className="flex justify-between gap-3 px-3 py-2">
                                    <dt className="text-stone-500">Local</dt>
                                    <dd className="font-medium text-right">{form.nombre_comercial}</dd>
                                </div>
                                <div className="flex justify-between gap-3 px-3 py-2">
                                    <dt className="text-stone-500">Subdominio</dt>
                                    <dd className="font-medium text-right">{meta?.subdomain}</dd>
                                </div>
                                <div className="flex justify-between gap-3 px-3 py-2">
                                    <dt className="text-stone-500">Administrador</dt>
                                    <dd className="font-medium text-right">
                                        {form.admin_nombre} {form.admin_apellido}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3 px-3 py-2">
                                    <dt className="text-stone-500">Correo admin</dt>
                                    <dd className="font-medium text-right break-all">{form.admin_correo}</dd>
                                </div>
                                <div className="flex justify-between items-center gap-3 px-3 py-2">
                                    <dt className="text-stone-500">Logo</dt>
                                    <dd className="font-medium text-right flex items-center gap-2 justify-end">
                                        {logoPreview ? (
                                            <>
                                                <img
                                                    src={logoPreview}
                                                    alt=""
                                                    className="h-8 w-8 rounded-md border border-stone-200 dark:border-stone-700 object-contain bg-white dark:bg-stone-900"
                                                />
                                                <span className="text-xs text-stone-600 dark:text-stone-400 max-w-[10rem] truncate">
                                                    {logo?.name}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-stone-400">Sin logo</span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                            <p className="text-xs text-stone-500">
                                Al confirmar se creará tu base de datos dedicada. Puede tardar unos segundos.
                            </p>
                        </div>
                    ) : null}

                    <div className="flex gap-2 pt-2">
                        {step > 1 ? (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setStep((s) => s - 1)}
                                className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-medium disabled:opacity-50"
                            >
                                Atrás
                            </button>
                        ) : (
                            <div className="flex-1" />
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                disabled={!canAdvanceStep()}
                                onClick={() => setStep((s) => s + 1)}
                                className="flex-1 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-3 text-sm disabled:opacity-50"
                            >
                                Continuar
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={busy || !meta}
                                onClick={() => void onSubmit()}
                                className="flex-1 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-3 text-sm disabled:opacity-50"
                            >
                                {busy ? 'Activando…' : 'Activar restaurante'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
