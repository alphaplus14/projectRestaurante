const SESSION_ENDED_KEY = 'session_ended_notice';
const SESSION_ENDED_FLAG = 'session_was_ended';

const DEFAULT_MESSAGE = 'Tu sesión se cerró. Vuelve a iniciar sesión.';

const TENANT_PROTECTED_PREFIXES = [
    '/mesero',
    '/admin',
    '/cocina',
    '/cajero',
    '/cliente/reservas',
];

const MASTER_LOGIN_PATH = '/master/login';
const MASTER_PROTECTED_PREFIXES = ['/master/dashboard'];

export function isTenantLoginPath(pathname) {
    return pathname === '/staff' || pathname === '/cliente/login';
}

export function isMasterLoginPath(pathname) {
    return pathname === MASTER_LOGIN_PATH;
}

export function isProtectedTenantPath(pathname) {
    return TENANT_PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

export function isProtectedMasterPath(pathname) {
    return MASTER_PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

export function markSessionEnded(message = DEFAULT_MESSAGE) {
    try {
        sessionStorage.setItem(SESSION_ENDED_KEY, message);
        sessionStorage.setItem(SESSION_ENDED_FLAG, '1');
    } catch {
        /* ignore */
    }
}

export function clearSessionEndedState() {
    try {
        sessionStorage.removeItem(SESSION_ENDED_KEY);
        sessionStorage.removeItem(SESSION_ENDED_FLAG);
    } catch {
        /* ignore */
    }
}

export function shouldShowSessionEndedNotice() {
    try {
        return sessionStorage.getItem(SESSION_ENDED_FLAG) === '1';
    } catch {
        return false;
    }
}

export function peekSessionEndedNotice() {
    if (!shouldShowSessionEndedNotice()) return '';
    try {
        return sessionStorage.getItem(SESSION_ENDED_KEY) || DEFAULT_MESSAGE;
    } catch {
        return DEFAULT_MESSAGE;
    }
}

/** Ruta de login según el módulo protegido que se intentó abrir. */
export function tenantLoginUrlForPath(pathname) {
    if (pathname.startsWith('/cliente')) return '/cliente/login';
    if (pathname.startsWith('/admin')) return '/staff?rol=admin';
    if (pathname.startsWith('/cocina')) return '/staff?rol=cocina';
    if (pathname.startsWith('/cajero')) return '/staff?rol=cajero';
    return '/staff?rol=mesero';
}
