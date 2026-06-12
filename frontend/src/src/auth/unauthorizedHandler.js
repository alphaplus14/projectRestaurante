import { clearToken } from './authStorage';
import {
    isProtectedTenantPath,
    isTenantLoginPath,
    markSessionEnded,
    tenantLoginUrlForPath,
} from './sessionNavigation';

let redirecting = false;

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Vuelve a iniciar sesión.';

/** Rutas de API donde un 401 es esperado y no debe forzar redirect (login, logout, etc.). */
export function isAuthApiPath(path) {
    return /^\/api\/auth\/(login(?:-|$)|register-|forgot-password|reset-password|two-factor|oauth\/exchange|logout)/.test(
        path,
    );
}

/**
 * Redirige al login del módulo actual cuando la API responde 401 en una zona protegida.
 * Usa asignación de URL (no React Router) para funcionar desde polling/intervalos.
 */
export function handleTenantUnauthorized() {
    if (redirecting) return;
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    if (isTenantLoginPath(pathname)) return;
    if (!isProtectedTenantPath(pathname)) return;

    redirecting = true;
    markSessionEnded(SESSION_EXPIRED_MESSAGE);
    clearToken();

    const loginUrl = tenantLoginUrlForPath(pathname);
    window.location.assign(loginUrl);
}

export function shouldHandleTenantUnauthorized(apiPath) {
    if (redirecting) return false;
    if (isAuthApiPath(apiPath)) return false;
    if (typeof window === 'undefined') return false;

    const pathname = window.location.pathname;
    if (isTenantLoginPath(pathname)) return false;

    return isProtectedTenantPath(pathname);
}
