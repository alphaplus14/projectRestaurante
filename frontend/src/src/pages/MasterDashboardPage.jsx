import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { clearMasterToken } from '../auth/masterAuthStorage';
import { MasterTenantCard } from '../components/MasterTenantCard';
import { ThemeToggle } from '../theme/ThemeToggle';
import { getBaseDomain } from '../tenancy/tenantContext';
import { validateTenantSlugInput } from '../utils/tenantSlug';

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
    const [accessActionId, setAccessActionId] = useState(null);
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

    const canManageAccess = (tenant) =>
        tenant.onboarding_completed_at && ['active', 'suspended'].includes(tenant.status);

    async function desactivarAcceso(tenant) {
        const nombre = tenant.nombre_comercial || tenant.slug;
        if (!window.confirm(`¿Desactivar el acceso de "${nombre}"? El cliente no podrá entrar a su subdominio.`)) {
            return;
        }

        setAccessActionId(tenant.id);
        setBanner('');
        try {
            const res = await masterApiFetch(`/api/master/tenants/${tenant.id}/suspend`, { method: 'POST' });
            setBanner(res?.message || 'Acceso desactivado.');
            await load();
        } catch (err) {
            setBanner(err?.message || 'No se pudo desactivar el acceso.');
        } finally {
            setAccessActionId(null);
        }
    }

    async function extenderAcceso(tenant, months) {
        setAccessActionId(`${tenant.id}-${months}`);
        setBanner('');
        try {
            const res = await masterApiFetch(`/api/master/tenants/${tenant.id}/extend-access`, {
                method: 'POST',
                body: JSON.stringify({ months }),
            });
            setBanner(res?.message || `Acceso extendido ${months} mes(es).`);
            await load();
        } catch (err) {
            setBanner(err?.message || 'No se pudo extender el acceso.');
        } finally {
            setAccessActionId(null);
        }
    }

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

            <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
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

                <section className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-lg">Restaurantes</h2>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {loading ? 'Cargando clientes…' : `${tenants.length} cliente${tenants.length === 1 ? '' : 's'} registrado${tenants.length === 1 ? '' : 's'}`}
                            </p>
                        </div>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-40 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/40 px-6 py-10 text-center">
                            <p className="text-sm text-stone-600 dark:text-stone-400">Aún no hay clientes.</p>
                            <p className="text-xs text-stone-500 mt-1">Crea la primera invitación en el formulario de arriba.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {tenants.map((t) => (
                                <MasterTenantCard
                                    key={t.id}
                                    tenant={t}
                                    baseDomain={getBaseDomain()}
                                    resendingId={resendingId}
                                    accessActionId={accessActionId}
                                    canResend={canResend}
                                    canManageAccess={canManageAccess}
                                    onResend={reenviarInvitacion}
                                    onExtend={extenderAcceso}
                                    onSuspend={desactivarAcceso}
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}
