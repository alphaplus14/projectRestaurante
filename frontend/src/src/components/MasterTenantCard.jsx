import React from 'react';

const LICENSE_MONTH_OPTIONS = [1, 3, 6, 12];

const STATUS_STYLES = {
    active: {
        text: 'Activo',
        pill: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-emerald-500/25',
        accent: 'border-l-emerald-500',
    },
<<<<<<< HEAD
=======
    scheduled_cancel: {
        text: 'Acceso hasta vencimiento',
        pill: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-amber-500/25',
        accent: 'border-l-amber-500',
    },
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
    pending: {
        text: 'Pendiente',
        pill: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-amber-500/25',
        accent: 'border-l-amber-500',
    },
    provisioning: {
        text: 'Configurando',
        pill: 'bg-violet-500/15 text-violet-800 dark:text-violet-200 ring-violet-500/25',
        accent: 'border-l-violet-500',
    },
    failed: {
        text: 'Falló',
        pill: 'bg-red-500/15 text-red-800 dark:text-red-200 ring-red-500/25',
        accent: 'border-l-red-500',
    },
    suspended: {
        text: 'Desactivado',
        pill: 'bg-red-500/15 text-red-800 dark:text-red-200 ring-red-500/25',
        accent: 'border-l-red-500',
    },
    expired: {
        text: 'Licencia vencida',
        pill: 'bg-red-500/15 text-red-800 dark:text-red-200 ring-red-500/25',
        accent: 'border-l-red-500',
    },
};

function resolveStatus(tenant) {
<<<<<<< HEAD
=======
    if (tenant.access_scheduled_cancellation && tenant.access_expires_at) {
        return STATUS_STYLES.scheduled_cancel;
    }
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
    if (tenant.status === 'active' && tenant.access_expires_at && !tenant.access_active) {
        return STATUS_STYLES.expired;
    }
    return STATUS_STYLES[tenant.status] || {
        text: tenant.status,
        pill: 'bg-stone-500/10 text-stone-700 dark:text-stone-300 ring-stone-500/20',
        accent: 'border-l-stone-400',
    };
}

function licenseMeta(tenant) {
    if (!tenant.access_expires_at) {
        return {
            label: 'Licencia',
            value: 'Sin vencimiento',
            hint: 'Acceso abierto hasta que definas meses',
            tone: 'neutral',
        };
    }

    const date = new Date(tenant.access_expires_at).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    if (!tenant.access_active) {
        return { label: 'Licencia', value: `Venció ${date}`, hint: 'Renueva para restaurar el acceso', tone: 'danger' };
    }

<<<<<<< HEAD
=======
    if (tenant.access_scheduled_cancellation) {
        return {
            label: 'Licencia',
            value: `Acceso hasta ${date}`,
            hint: 'Cancelación programada. Reactiva extendiendo meses.',
            tone: 'warning',
        };
    }

>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
    const days = tenant.access_days_remaining;
    if (typeof days === 'number' && days <= 7) {
        return {
            label: 'Licencia',
            value: `Vence ${date}`,
            hint: `${days} día${days === 1 ? '' : 's'} restantes`,
            tone: 'warning',
        };
    }

    return {
        label: 'Licencia',
        value: `Vence ${date}`,
        hint: typeof days === 'number' ? `${days} días restantes` : null,
        tone: 'success',
    };
}

function toneClass(tone) {
    if (tone === 'danger') return 'text-red-700 dark:text-red-300';
    if (tone === 'warning') return 'text-amber-700 dark:text-amber-300';
    if (tone === 'success') return 'text-emerald-700 dark:text-emerald-300';
    return 'text-stone-700 dark:text-stone-300';
}

function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
}

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function MasterTenantCard({
    tenant,
    baseDomain,
    resendingId,
    accessActionId,
    canResend,
    canManageAccess,
    onResend,
    onExtend,
    onSuspend,
<<<<<<< HEAD
=======
    onExtendRequest,
    onSuspendRequest,
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
}) {
    const status = resolveStatus(tenant);
    const license = canManageAccess(tenant) ? licenseMeta(tenant) : null;
    const displayName = tenant.nombre_comercial || tenant.slug;
    const tenantHost = `${tenant.slug}.${baseDomain}`;
    const showQuickLinks = tenant.access_active && tenant.admin_login;

    return (
        <li
            className={classNames(
                'group rounded-2xl border border-stone-200/90 dark:border-stone-800',
                'bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-shadow',
                'border-l-4',
                status.accent,
            )}
        >
            <div className="p-4 sm:p-5 space-y-4">
                <div className="flex gap-3 sm:gap-4 items-start justify-between">
                    <div className="flex gap-3 min-w-0 flex-1">
                        <div
                            className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 text-white font-semibold text-sm flex items-center justify-center shadow-sm"
                            aria-hidden
                        >
                            {initials(displayName)}
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-base text-stone-900 dark:text-stone-50 truncate">
                                    {displayName}
                                </h3>
                                <span
                                    className={classNames(
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                        status.pill,
                                    )}
                                >
                                    {status.text}
                                </span>
                            </div>
                            <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{tenant.contact_email}</p>
                            <p className="inline-flex items-center gap-1.5 text-xs font-mono text-violet-700 dark:text-violet-300 bg-violet-500/8 dark:bg-violet-500/10 rounded-md px-2 py-1 border border-violet-500/15">
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" aria-hidden />
                                {tenantHost}
                            </p>
                        </div>
                    </div>
                </div>

                {(tenant.provision_error || tenant.onboarding_completed_at || license) && (
                    <div className="grid gap-2 sm:grid-cols-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 px-3 py-2.5">
                        {tenant.onboarding_completed_at ? (
                            <div>
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-500">Activado</p>
                                <p className="text-sm text-stone-800 dark:text-stone-200">
                                    {new Date(tenant.onboarding_completed_at).toLocaleString('es-CO', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-500">Estado</p>
                                <p className="text-sm text-stone-600 dark:text-stone-400">Esperando onboarding del cliente</p>
<<<<<<< HEAD
=======
                                {tenant.license_months ? (
                                    <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                                        Licencia incluida: {tenant.license_months}{' '}
                                        {tenant.license_months === 1 ? 'mes' : 'meses'} (al activar)
                                    </p>
                                ) : null}
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                            </div>
                        )}
                        {license ? (
                            <div>
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-500">{license.label}</p>
                                <p className={classNames('text-sm font-medium', toneClass(license.tone))}>{license.value}</p>
                                {license.hint ? (
                                    <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">{license.hint}</p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                )}

                {tenant.provision_error ? (
                    <p className="text-sm text-red-700 dark:text-red-300 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-500/20 px-3 py-2">
                        {tenant.provision_error}
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    {canResend(tenant.status) ? (
                        <button
                            type="button"
                            disabled={resendingId === tenant.id}
                            onClick={() => onResend(tenant.id)}
                            className="inline-flex items-center rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium px-3.5 py-2 disabled:opacity-50 transition-colors"
                        >
                            {resendingId === tenant.id
                                ? 'Enviando…'
                                : tenant.status === 'provisioning'
                                  ? 'Reenviar / reiniciar'
                                  : 'Reenviar invitación'}
                        </button>
                    ) : null}

                    {showQuickLinks ? (
                        <>
                            <a
                                href={tenant.admin_login}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-lg border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 text-amber-900 dark:text-amber-100 text-sm font-medium px-3.5 py-2 transition-colors"
                            >
                                Panel admin
                            </a>
                            <a
                                href={tenant.cliente_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-lg border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 text-sm font-medium px-3.5 py-2 transition-colors"
                            >
                                Sitio clientes
                            </a>
                        </>
                    ) : null}
                </div>

                {canManageAccess(tenant) ? (
                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/40 p-3 sm:p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    {tenant.status === 'suspended' ? 'Reactivar acceso' : 'Gestionar licencia'}
                                </p>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                    {tenant.status === 'suspended'
<<<<<<< HEAD
                                        ? 'Elige cuántos meses habilitar al restaurar el acceso.'
                                        : 'Suma meses a la fecha actual de vencimiento.'}
=======
                                        ? 'Elige cuántos meses habilitar al reactivar la suscripción.'
                                        : tenant.access_scheduled_cancellation
                                          ? 'Al extender meses se reactiva la suscripción y se quita la cancelación programada.'
                                          : 'Suma meses a la fecha actual de vencimiento.'}
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {LICENSE_MONTH_OPTIONS.map((months) => {
                                const busy = accessActionId === `${tenant.id}-${months}`;
                                const isPrimary = tenant.status === 'suspended' && months === 3;
                                return (
                                    <button
                                        key={months}
                                        type="button"
                                        disabled={busy}
<<<<<<< HEAD
                                        onClick={() => onExtend(tenant, months)}
=======
                                        onClick={() =>
                                            onExtendRequest
                                                ? onExtendRequest(tenant, months)
                                                : onExtend(tenant, months)
                                        }
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                                        className={classNames(
                                            'rounded-xl px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-50',
                                            isPrimary
                                                ? 'bg-violet-700 hover:bg-violet-600 text-white shadow-sm'
                                                : 'border border-violet-500/30 bg-white dark:bg-stone-900 text-violet-800 dark:text-violet-200 hover:border-violet-500/50 hover:bg-violet-500/5',
                                        )}
                                    >
                                        {busy ? '…' : `+${months} ${months === 1 ? 'mes' : 'meses'}`}
                                    </button>
                                );
                            })}
                        </div>

<<<<<<< HEAD
                        {tenant.status === 'active' && tenant.access_active ? (
=======
                        {tenant.status === 'active' && tenant.access_active && !tenant.access_scheduled_cancellation ? (
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                            <div className="flex justify-end pt-1 border-t border-stone-200/80 dark:border-stone-800">
                                <button
                                    type="button"
                                    disabled={accessActionId === tenant.id}
<<<<<<< HEAD
                                    onClick={() => onSuspend(tenant)}
                                    className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-colors"
                                >
                                    {accessActionId === tenant.id ? 'Desactivando…' : 'Desactivar acceso'}
                                </button>
                            </div>
=======
                                    onClick={() =>
                                        onSuspendRequest ? onSuspendRequest(tenant) : onSuspend(tenant)
                                    }
                                    className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-colors"
                                >
                                    {accessActionId === tenant.id ? 'Procesando…' : 'Desactivar acceso'}
                                </button>
                            </div>
                        ) : tenant.access_scheduled_cancellation ? (
                            <p className="text-xs text-amber-800 dark:text-amber-200 pt-1 border-t border-stone-200/80 dark:border-stone-800">
                                El acceso se cortará automáticamente al vencer la licencia. Para reactivar, extiende meses.
                            </p>
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                        ) : null}
                    </div>
                ) : null}
            </div>
        </li>
    );
}
