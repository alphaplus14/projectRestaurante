/**
 * Resuelve el slug del tenant por subdominio (modo multi).
 * En local sin subdominio: VITE_DEV_TENANT_SLUG o localStorage dev_tenant_slug.
 */

const DEV_SLUG_KEY = 'dev_tenant_slug';

export function getBaseDomain() {
    return import.meta.env.VITE_TENANT_BASE_DOMAIN || 'localhost';
}

export function getMasterSubdomain() {
    return import.meta.env.VITE_TENANT_MASTER_SUBDOMAIN || 'master';
}

export function getSubdomainFromHost() {
    const host = window.location.hostname.toLowerCase();
    const base = getBaseDomain().toLowerCase();

    if (host === base) {
        return null;
    }

    const suffix = `.${base}`;
    if (!host.endsWith(suffix)) {
        return null;
    }

    const sub = host.slice(0, -suffix.length);
    if (!sub || sub.includes('.')) {
        return null;
    }

    return sub;
}

export function isMasterHost() {
    return getSubdomainFromHost() === getMasterSubdomain();
}

export function isOnboardingHost() {
    return getSubdomainFromHost() === null;
}

export function getTenantSlugForApi() {
    const fromHost = getSubdomainFromHost();
    if (fromHost && fromHost !== getMasterSubdomain()) {
        const reserved = (import.meta.env.VITE_TENANT_RESERVED || 'www,api,onboarding,mail')
            .split(',')
            .map((s) => s.trim());
        if (!reserved.includes(fromHost)) {
            return fromHost;
        }
    }

    const envSlug = import.meta.env.VITE_DEV_TENANT_SLUG;
    if (envSlug) {
        return String(envSlug).trim().toLowerCase();
    }

    try {
        const stored = localStorage.getItem(DEV_SLUG_KEY);
        if (stored) {
            return stored.trim().toLowerCase();
        }
    } catch {
        /* ignore */
    }

    return null;
}

export function setDevTenantSlug(slug) {
    try {
        if (slug) {
            localStorage.setItem(DEV_SLUG_KEY, slug);
        } else {
            localStorage.removeItem(DEV_SLUG_KEY);
        }
    } catch {
        /* ignore */
    }
}

export function tenantAppOrigin(slug) {
    const scheme = import.meta.env.VITE_TENANT_SCHEME || 'http';
    const port = import.meta.env.VITE_TENANT_PORT || window.location.port;
    const portSuffix = port ? `:${port}` : '';
    return `${scheme}://${slug}.${getBaseDomain()}${portSuffix}`;
}
