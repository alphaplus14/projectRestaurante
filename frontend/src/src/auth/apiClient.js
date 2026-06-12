import { getToken } from './authStorage';
import { formatApiErrorForUser } from '../utils/friendlyApiError';
import { getTenantSlugForApi } from '../tenancy/tenantContext';
import {
    detectTenantAccessBlock,
    redirectToTenantAccessBlocked,
    shouldHandleTenantAccessRedirect,
} from '../utils/tenantAccess';
import {
    handleTenantUnauthorized,
    isAuthApiPath,
    shouldHandleTenantUnauthorized,
} from './unauthorizedHandler';

/** Login/registro: no enviar token viejo ni redirigir a /acceso-bloqueado (mostrar error en el formulario). */
function isAuthEntryPath(path) {
    return isAuthApiPath(path);
}

export async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body && !isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = getToken();
    if (token && !isAuthEntryPath(path) && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const tenantSlug = getTenantSlugForApi();
    if (tenantSlug && !headers.has('X-Tenant-Slug')) {
        headers.set('X-Tenant-Slug', tenantSlug);
    }

    const res = await fetch(path, { ...options, headers });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const dataObj = isJson && data && typeof data === 'object' ? data : null;
        const rawText = typeof data === 'string' ? data : null;

        if (res.status === 401 && !options.skipSessionRedirect && shouldHandleTenantUnauthorized(path)) {
            handleTenantUnauthorized();
            const err = new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
            err.status = 401;
            err.unauthorized = true;
            throw err;
        }

        if (shouldHandleTenantAccessRedirect() && !isAuthEntryPath(path)) {
            const blocked = detectTenantAccessBlock(res.status, dataObj);
            if (blocked) {
                redirectToTenantAccessBlocked(blocked.reason, blocked.message);
            }
        }

        const message = formatApiErrorForUser(res.status, dataObj, rawText);

        const err = new Error(message);
        err.status = res.status;
        err.data = dataObj ?? (typeof data === 'object' ? data : null);
        throw err;
    }

    return data;
}

