import React from 'react';
import { getBaseDomain, getMasterSubdomain, isMasterHost } from '../tenancy/tenantContext';

/**
 * Master solo en subdominio master.* (no en tenants).
 */
export function RequireMasterHost({ children }) {
    if (isMasterHost()) {
        return children;
    }

    const scheme = import.meta.env.VITE_TENANT_SCHEME || window.location.protocol.replace(':', '');
    const port = import.meta.env.VITE_TENANT_PORT || window.location.port;
    const portSuffix = port ? `:${port}` : '';
    const master = getMasterSubdomain();
    const base = getBaseDomain();
    const path = window.location.pathname.startsWith('/master')
        ? window.location.pathname
        : '/master/login';

    window.location.replace(`${scheme}://${master}.${base}${portSuffix}${path}`);

    return (
        <div className="min-h-screen flex items-center justify-center text-stone-600 dark:text-stone-400 text-sm">
            Redirigiendo a la plataforma Master…
        </div>
    );
}
