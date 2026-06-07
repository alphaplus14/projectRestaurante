import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { clearMasterToken } from '../auth/masterAuthStorage';
import { ThemeToggle } from '../theme/ThemeToggle';
import { getBaseDomain } from '../tenancy/tenantContext';
import { validateTenantSlugInput } from '../utils/tenantSlug';

const STATUS_LABEL = {
    pending: { text: 'Pendiente', className: 'text-amber-700 dark:text-amber-300' },
    provisioning: { text: 'Configurando…', className: 'text-violet-700 dark:text-violet-300' },
    active: { text: 'Activo', className: 'text-emerald-700 dark:text-emerald-300' },
    failed: { text: 'Falló', className: 'text-red-700 dark:text-red-300' },
    suspended: { text: 'Suspendido', className: 'text-stone-600 dark:text-stone-400' },
};

function statusOf(s) {
    return STATUS_LABEL[s] || { text: s, className: 'text-stone-600' };
}

export function MasterDashboardPage() {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [email, setEmail] = useState('');
    const [slug, setSlug] = useState('');
    const slugValidation = validateTenantSlugInput(slug);
    const [banner, setBanner] = useState('');
    const [lastLink, setLastLink] = useState('');
    const [busy, setBusy] = useState(false);
    const [resendingId, setResendingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await masterApiFetch('/api/master/tenants');
            setTenants(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            if (e?.status === 401) {
                clearMasterToken();
                navigate('/master/login', { replace: true });
                return;
            }
            setBanner(e?.message || 'No se pudo cargar la lista.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        void load();
    }, [load]);

    async function crearInvitacion(e) {
        e.preventDefault();
        const check = validateTenantSlugInput(slug);
        if (!check.ok) {
            setBanner(check.error);
            return;
        }

        setBusy(true);
        setBanner('');
        setLastLink('');
        try {
            const res = await masterApiFetch('/api/master/invitations', {
                method: 'POST',
                body: JSON.stringify({
                    email: email.trim(),
                    slug: check.normalized,
                }),
            });
            setLastLink(res?.data?.onboarding_url || '');
            const msg = res?.data?.email_sent === false && res?.data?.email_error
                ? `${res?.message || 'Invitación creada.'} ${res.data.email_error}`
                : (res?.message || 'Invitación creada.');
            setBanner(msg);
            setEmail('');
            setSlug('');
            await load();
        } catch (err) {
            setBanner(err?.message || 'No se pudo crear la invitación.');
        } finally {
            setBusy(false);
        }
    }

    async function reenviarInvitacion(tenantId) {
        setResendingId(tenantId);
        setBanner('');
        try {
            const res = await masterApiFetch(`/api/master/tenants/${tenantId}/resend-invitation`, {
                method: 'POST',
            });
            setLastLink(res?.data?.onboarding_url || '');
            const msg = res?.data?.email_sent === false && res?.data?.email_error
                ? `${res?.message || 'Invitación reenviada.'} ${res.data.email_error}`
                : (res?.message || 'Invitación reenviada.');
            setBanner(msg);
            await load();
        } catch (err) {
            setBanner(err?.message || 'No se pudo reenviar.');
        } finally {
            setResendingId(null);
        }
    }

    function copiarEnlace() {
        if (!lastLink) return;
        void navigator.clipboard?.writeText(lastLink);
        setBanner('Enlace copiado. Envíalo al cliente por WhatsApp o correo.');
    }

    async function salir() {
        try {
            await masterApiFetch('/api/master/auth/logout', { method: 'POST' });
        } catch {
            /* ignore */
        }
        clearMasterToken();
        navigate('/master/login', { replace: true });
    }

    const canResend = (status) => ['pending', 'failed', 'provisioning'].includes(status);

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
            <header className="border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">Master — clientes</h1>
                    <p className="text-xs text-stone-500">
                        Flujo: invitar → cliente configura onboarding → opera en{' '}
                        <code className="text-violet-600 dark:text-violet-400">{'{slug}.'}{getBaseDomain()}</code>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={salir}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm"
                    >
                        Salir
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
                {banner ? (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 text-sm">
                        {banner}
                    </div>
                ) : null}

                <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
                    <h2 className="font-semibold">Nueva invitación</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        El cliente recibirá un correo con el enlace de configuración inicial (onboarding). Ahí define su local,
                        crea el usuario admin y activa su base de datos.
                    </p>
                    <form onSubmit={crearInvitacion} className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm sm:col-span-2">
                            <span className="text-stone-500">Correo del cliente</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950"
                            />
                        </label>
                        <label className="text-sm sm:col-span-2">
                            <span className="text-stone-500">Subdominio (slug)</span>
                            <input
                                type="text"
                                required
                                placeholder="mi-restaurante o ñapita"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                aria-invalid={slug.length > 0 && !slugValidation.ok}
                                aria-describedby="slug-help slug-error"
                                className={`mt-1 w-full rounded-lg border px-3 py-2 bg-stone-50 dark:bg-stone-950 ${
                                    slug.length > 0 && !slugValidation.ok
                                        ? 'border-red-400 dark:border-red-500/60'
                                        : 'border-stone-200 dark:border-stone-700'
                                }`}
                            />
                            <p id="slug-help" className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                                Letras (incluida ñ), números y guiones. Sin emojis ni símbolos (@, #, %…).
                                {slugValidation.ok && slugValidation.normalized ? (
                                    <span className="block mt-1 text-violet-700 dark:text-violet-400">
                                        URL:{' '}
                                        <strong>
                                            {slugValidation.normalized}.{getBaseDomain()}
                                        </strong>
                                        {(slug.includes('ñ') || slug.includes('Ñ')) && (
                                            <span className="text-stone-500 dark:text-stone-400"> — la ñ se guarda como n</span>
                                        )}
                                    </span>
                                ) : null}
                            </p>
                            {slug.length > 0 && slugValidation.error ? (
                                <p id="slug-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                                    {slugValidation.error}
                                    {slugValidation.hint ? (
                                        <span className="block text-stone-500 dark:text-stone-400 mt-0.5">{slugValidation.hint}</span>
                                    ) : null}
                                </p>
                            ) : null}
                        </label>
                        <div className="flex items-end sm:col-span-2 sm:max-w-xs">
                            <button
                                type="submit"
                                disabled={busy || (slug.length > 0 && !slugValidation.ok)}
                                className="w-full rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-2.5 text-sm disabled:opacity-50"
                            >
                                {busy ? 'Creando…' : 'Invitar cliente'}
                            </button>
                        </div>
                    </form>
                    {lastLink ? (
                        <div className="rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-3 space-y-2">
                            <p className="text-xs text-stone-500">Enlace de onboarding (enviar al cliente si el correo falló):</p>
                            <p className="text-xs break-all">{lastLink}</p>
                            <button
                                type="button"
                                onClick={copiarEnlace}
                                className="text-sm font-medium text-violet-700 dark:text-violet-400"
                            >
                                Copiar enlace
                            </button>
                        </div>
                    ) : null}
                </section>

                <section className="space-y-3">
                    <h2 className="font-semibold">Restaurantes</h2>
                    {loading ? (
                        <p className="text-sm text-stone-500">Cargando…</p>
                    ) : tenants.length === 0 ? (
                        <p className="text-sm text-stone-500">Aún no hay clientes. Crea la primera invitación arriba.</p>
                    ) : (
                        <ul className="space-y-2">
                            {tenants.map((t) => {
                                const st = statusOf(t.status);
                                return (
                                    <li
                                        key={t.id}
                                        className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 space-y-2"
                                    >
                                        <div className="flex flex-wrap justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium">{t.nombre_comercial || t.slug}</p>
                                                <p className="text-xs text-stone-500">{t.contact_email}</p>
                                                <p className="text-xs text-stone-500">
                                                    {t.slug}.{getBaseDomain()} —{' '}
                                                    <span className={`font-medium ${st.className}`}>{st.text}</span>
                                                </p>
                                                {t.provision_error ? (
                                                    <p className="text-xs text-red-600 mt-1">{t.provision_error}</p>
                                                ) : null}
                                                {t.onboarding_completed_at ? (
                                                    <p className="text-xs text-stone-500 mt-1">
                                                        Activado: {new Date(t.onboarding_completed_at).toLocaleString('es-CO')}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                {canResend(t.status) ? (
                                                    <button
                                                        type="button"
                                                        disabled={resendingId === t.id}
                                                        onClick={() => reenviarInvitacion(t.id)}
                                                        className="text-sm font-medium text-violet-700 dark:text-violet-400 disabled:opacity-50"
                                                    >
                                                        {resendingId === t.id
                                                            ? 'Enviando…'
                                                            : t.status === 'provisioning'
                                                              ? 'Reenviar / reiniciar'
                                                              : 'Reenviar correo'}
                                                    </button>
                                                ) : null}
                                                {t.status === 'active' ? (
                                                    <>
                                                        <a
                                                            href={t.admin_login}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm text-amber-700 dark:text-amber-400"
                                                        >
                                                            Panel admin
                                                        </a>
                                                        <a
                                                            href={t.cliente_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm text-emerald-700 dark:text-emerald-400"
                                                        >
                                                            Sitio clientes
                                                        </a>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}
