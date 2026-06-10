import React from 'react';
import { useLocation } from 'react-router-dom';
import { getBaseDomain, isOnboardingHost } from '../tenancy/tenantContext';

/**
 * Onboarding solo en dominio raíz (sin subdominio de tenant ni master).
 */
export function RequireOnboardingHost({ children }) {
    const location = useLocation();

    if (isOnboardingHost()) {
        return children;
    }

    const scheme = import.meta.env.VITE_TENANT_SCHEME || window.location.protocol.replace(':', '');
    const port = import.meta.env.VITE_TENANT_PORT || window.location.port;
    const portSuffix = port ? `:${port}` : '';
    const base = getBaseDomain();

    window.location.replace(`${scheme}://${base}${portSuffix}${location.pathname}${location.search}`);

    return (
        <div className="min-h-screen flex items-center justify-center text-stone-600 dark:text-stone-400 text-sm">
            Redirigiendo al enlace de configuración…
        </div>
    );
}
