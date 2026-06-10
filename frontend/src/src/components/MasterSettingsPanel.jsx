import React, { useEffect, useState } from 'react';
import { masterApiFetch } from '../auth/masterApiClient';
import { getBaseDomain } from '../tenancy/tenantContext';

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2.5 border-b border-stone-100 dark:border-stone-800 last:border-0">
            <dt className="text-sm text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="text-sm font-medium text-stone-900 dark:text-stone-100 sm:text-right break-all">{value}</dd>
        </div>
    );
}

export function MasterSettingsPanel() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [platform, setPlatform] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const [meRes, settingsRes] = await Promise.all([
                    masterApiFetch('/api/master/auth/me'),
                    masterApiFetch('/api/master/platform/settings'),
                ]);
                if (cancelled) {
                    return;
                }
                setUser(meRes?.user ?? null);
                setPlatform(settingsRes?.data ?? null);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'No se pudieron cargar los ajustes.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <p className="text-sm text-stone-500">Cargando ajustes…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
    }

    const baseDomain = platform?.base_domain || getBaseDomain();
    const masterHost = `${platform?.master_subdomain || 'master'}.${baseDomain}`;

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <h2 className="font-semibold text-lg">Cuenta Master</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Usuario con acceso a la plataforma de proveedor.
                </p>
                <dl className="mt-4">
                    <InfoRow label="Nombre" value={user?.name || '—'} />
                    <InfoRow label="Correo" value={user?.email || '—'} />
                    <InfoRow
                        label="Verificación 2FA"
                        value={user?.two_factor_enabled ? 'Activa' : 'No configurada'}
                    />
                </dl>
            </section>

            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <h2 className="font-semibold text-lg">Plataforma</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Valores de configuración del servidor (solo lectura). Se cambian en el `.env` del backend.
                </p>
                <dl className="mt-4">
                    <InfoRow label="Modo tenancy" value={platform?.tenancy_mode || '—'} />
                    <InfoRow label="Dominio base" value={baseDomain} />
                    <InfoRow label="Panel Master" value={masterHost} />
                    <InfoRow label="Prefijo BD tenant" value={platform?.database_prefix || 'rest_'} />
                    <InfoRow
                        label="Licencia inicial (onboarding)"
                        value={
                            platform?.default_license_months
                                ? `${platform.default_license_months} mes(es)`
                                : 'Sin vencimiento'
                        }
                    />
                    <InfoRow
                        label="Enlace onboarding (TTL)"
                        value={`${platform?.onboarding_ttl_hours ?? 72} horas`}
                    />
                </dl>
            </section>
        </div>
    );
}
