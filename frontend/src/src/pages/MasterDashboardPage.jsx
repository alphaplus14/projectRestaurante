<<<<<<< HEAD
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
=======
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { clearMasterToken } from '../auth/masterAuthStorage';
import { MasterBillingRenewalsPanel } from '../components/MasterBillingRenewalsPanel';
import { MasterConfirmModal } from '../components/MasterConfirmModal';
import { MasterSettingsPanel } from '../components/MasterSettingsPanel';
import { MasterTenantCard } from '../components/MasterTenantCard';
import { MasterTwoFactorPanel } from '../components/MasterTwoFactorPanel';
import { ThemeToggle } from '../theme/ThemeToggle';
import { getBaseDomain } from '../tenancy/tenantContext';
import { formatAccessDate, previewAccessExpiry } from '../utils/masterAccess';
import { validateTenantSlugInput } from '../utils/tenantSlug';

const TABS = [
    { id: 'clientes', label: 'Clientes' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'ajustes', label: 'Ajustes' },
    { id: 'seguridad', label: 'Seguridad' },
];

const LICENSE_MONTH_OPTIONS = [1, 3, 6, 12];

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function MasterDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clientes');
    const [tenants, setTenants] = useState([]);
    const [email, setEmail] = useState('');
    const [slug, setSlug] = useState('');
    const [licenseMonths, setLicenseMonths] = useState(1);
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
    const slugValidation = validateTenantSlugInput(slug);
    const [banner, setBanner] = useState('');
    const [lastLink, setLastLink] = useState('');
    const [busy, setBusy] = useState(false);
    const [resendingId, setResendingId] = useState(null);
    const [accessActionId, setAccessActionId] = useState(null);
    const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
    const [confirm, setConfirm] = useState(null);
    const [confirmBusy, setConfirmBusy] = useState(false);
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235

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
<<<<<<< HEAD
=======
                    license_months: licenseMonths,
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
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

<<<<<<< HEAD
    async function desactivarAcceso(tenant) {
        const nombre = tenant.nombre_comercial || tenant.slug;
        if (!window.confirm(`¿Desactivar el acceso de "${nombre}"? El cliente no podrá entrar a su subdominio.`)) {
            return;
        }

=======
    async function ejecutarDesactivar(tenant) {
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        setAccessActionId(tenant.id);
        setBanner('');
        try {
            const res = await masterApiFetch(`/api/master/tenants/${tenant.id}/suspend`, { method: 'POST' });
<<<<<<< HEAD
            setBanner(res?.message || 'Acceso desactivado.');
=======
            setBanner(res?.message || 'Acceso actualizado.');
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
            await load();
        } catch (err) {
            setBanner(err?.message || 'No se pudo desactivar el acceso.');
        } finally {
            setAccessActionId(null);
        }
    }

<<<<<<< HEAD
    async function extenderAcceso(tenant, months) {
=======
    async function ejecutarExtender(tenant, months) {
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
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

<<<<<<< HEAD
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
=======
    const confirmModal = useMemo(() => {
        if (!confirm) {
            return null;
        }

        const nombre = confirm.tenant?.nombre_comercial || confirm.tenant?.slug || 'restaurante';

        if (confirm.type === 'suspend') {
            const tenant = confirm.tenant;
            const tieneFecha = tenant?.access_expires_at && tenant?.access_active;
            const fechaFin = tieneFecha ? formatAccessDate(new Date(tenant.access_expires_at)) : null;

            return {
                title: 'Desactivar acceso',
                description: tieneFecha
                    ? `¿Programar la desactivación de "${nombre}"? El cliente podrá seguir usando el sistema hasta el ${fechaFin}. Después se bloqueará automáticamente.`
                    : `¿Desactivar "${nombre}" ahora? No tiene fecha de licencia; el acceso se cortará de inmediato.`,
                confirmLabel: tieneFecha ? 'Programar desactivación' : 'Desactivar ahora',
                variant: 'danger',
                body: tieneFecha ? (
                    <p className="text-stone-600 dark:text-stone-400">
                        Para reactivar la suscripción más adelante, extiende meses desde este panel.
                    </p>
                ) : null,
            };
        }

        if (confirm.type === 'extend') {
            const tenant = confirm.tenant;
            const months = confirm.months;
            const actual = tenant?.access_expires_at ? new Date(tenant.access_expires_at) : null;
            const nueva = previewAccessExpiry(tenant?.access_expires_at, months);
            const reactiva = tenant?.status === 'suspended' || tenant?.access_scheduled_cancellation;

            return {
                title: reactiva ? 'Reactivar suscripción' : 'Extender licencia',
                description: reactiva
                    ? `¿Confirmar pago y reactivar "${nombre}" por ${months} mes(es)?`
                    : `¿Sumar ${months} mes(es) a la licencia de "${nombre}"?`,
                confirmLabel: reactiva ? 'Reactivar y extender' : 'Confirmar extensión',
                variant: 'default',
                body: (
                    <div className="rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-3 py-2.5 space-y-1">
                        <p className="text-stone-700 dark:text-stone-300">
                            <span className="text-stone-500">Vencimiento actual:</span>{' '}
                            {actual && actual > new Date() ? formatAccessDate(actual) : 'Hoy / vencida'}
                        </p>
                        <p className="font-medium text-violet-800 dark:text-violet-200">
                            <span className="text-stone-500 font-normal">Nuevo vencimiento:</span>{' '}
                            {formatAccessDate(nueva)}
                        </p>
                    </div>
                ),
            };
        }

        return null;
    }, [confirm]);

    async function onConfirmModal() {
        if (!confirm) {
            return;
        }

        setConfirmBusy(true);
        try {
            if (confirm.type === 'suspend') {
                await ejecutarDesactivar(confirm.tenant);
            } else if (confirm.type === 'extend') {
                await ejecutarExtender(confirm.tenant, confirm.months);
            }
            setConfirm(null);
        } finally {
            setConfirmBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
            <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur">
                <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">Master</h1>
                        <p className="text-xs text-stone-500">
                            Plataforma ·{' '}
                            <code className="text-violet-600 dark:text-violet-400">master.{getBaseDomain()}</code>
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
                </div>
                <nav
                    className="mx-auto max-w-4xl px-4 flex flex-wrap gap-1"
                    aria-label="Secciones Master"
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={classNames(
                                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                                activeTab === tab.id
                                    ? 'border-violet-600 text-violet-700 dark:text-violet-300'
                                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
            </header>

            <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
                {banner ? (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 text-sm">
                        {banner}
                    </div>
                ) : null}

<<<<<<< HEAD
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
=======
                {activeTab === 'clientes' ? (
                    <>
                        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
                            <h2 className="font-semibold">Nueva invitación</h2>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                El cliente recibirá un correo con el enlace de configuración inicial (onboarding). Al
                                completar el formulario, se activará la licencia por los meses que indiques.
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
                                        placeholder="mi-restaurante"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        aria-invalid={slug.length > 0 && !slugValidation.ok}
                                        className={`mt-1 w-full rounded-lg border px-3 py-2 bg-stone-50 dark:bg-stone-950 ${
                                            slug.length > 0 && !slugValidation.ok
                                                ? 'border-red-400 dark:border-red-500/60'
                                                : 'border-stone-200 dark:border-stone-700'
                                        }`}
                                    />
                                    {slugValidation.ok && slugValidation.normalized ? (
                                        <p className="mt-1.5 text-xs text-violet-700 dark:text-violet-400">
                                            URL: <strong>{slugValidation.normalized}.{getBaseDomain()}</strong>
                                        </p>
                                    ) : null}
                                    {slug.length > 0 && slugValidation.error ? (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                                            {slugValidation.error}
                                        </p>
                                    ) : null}
                                </label>
                                <label className="text-sm sm:col-span-2 sm:max-w-xs">
                                    <span className="text-stone-500">Meses de suscripción pagados</span>
                                    <select
                                        value={licenseMonths}
                                        onChange={(e) => setLicenseMonths(Number(e.target.value))}
                                        className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950"
                                    >
                                        {LICENSE_MONTH_OPTIONS.map((m) => (
                                            <option key={m} value={m}>
                                                {m} {m === 1 ? 'mes' : 'meses'}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-stone-500">
                                        La licencia arranca al terminar el onboarding del cliente.
                                    </p>
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
                                    <p className="text-xs text-stone-500">Enlace de onboarding:</p>
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
                            <div>
                                <h2 className="font-semibold text-lg">Restaurantes</h2>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    {loading
                                        ? 'Cargando clientes…'
                                        : `${tenants.length} cliente${tenants.length === 1 ? '' : 's'}`}
                                </p>
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
                                <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-10 text-center">
                                    <p className="text-sm text-stone-600 dark:text-stone-400">Aún no hay clientes.</p>
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
                                            onExtendRequest={(tenant, months) =>
                                                setConfirm({ type: 'extend', tenant, months })
                                            }
                                            onSuspendRequest={(tenant) => setConfirm({ type: 'suspend', tenant })}
                                        />
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                ) : null}

                {activeTab === 'pagos' ? (
                    <MasterBillingRenewalsPanel
                        onMessage={(msg) => {
                            setBanner(msg);
                            void load();
                        }}
                    />
                ) : null}

                {activeTab === 'ajustes' ? <MasterSettingsPanel onMessage={setBanner} /> : null}

                {activeTab === 'seguridad' ? (
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-semibold text-lg">Autenticación</h2>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                                Protege el acceso al panel Master con verificación en dos pasos.
                            </p>
                        </div>
                        <MasterTwoFactorPanel />
                    </div>
                ) : null}
            </main>

            <MasterConfirmModal
                open={Boolean(confirm && confirmModal)}
                title={confirmModal?.title || ''}
                description={confirmModal?.description || ''}
                confirmLabel={confirmModal?.confirmLabel}
                variant={confirmModal?.variant}
                busy={confirmBusy}
                onConfirm={onConfirmModal}
                onCancel={() => {
                    if (!confirmBusy) {
                        setConfirm(null);
                    }
                }}
            >
                {confirmModal?.body}
            </MasterConfirmModal>
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        </div>
    );
}
