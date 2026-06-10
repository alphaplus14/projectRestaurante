import { isMasterHost } from '../tenancy/tenantContext';

export const TENANT_ACCESS_CODES = {
    SUSPENDED: 'tenant_suspended',
    LICENSE_EXPIRED: 'tenant_license_expired',
};

const REASON_BY_CODE = {
    [TENANT_ACCESS_CODES.SUSPENDED]: 'suspended',
    [TENANT_ACCESS_CODES.LICENSE_EXPIRED]: 'expired',
};

const MESSAGE_HINTS = {
    suspended: TENANT_ACCESS_CODES.SUSPENDED,
    expired: TENANT_ACCESS_CODES.LICENSE_EXPIRED,
};

export function reasonFromAccessCode(code) {
    return REASON_BY_CODE[code] ?? null;
}

export function reasonFromAccessMessage(message) {
    const text = String(message || '').toLowerCase();
    if (text.includes('desactivado')) {
        return 'suspended';
    }
    if (text.includes('licencia') && text.includes('venc')) {
        return 'expired';
    }
    return null;
}

export function detectTenantAccessBlock(status, data) {
    if (status !== 403 || !data || typeof data !== 'object') {
        return null;
    }

    const fromCode = reasonFromAccessCode(data.code);
    if (fromCode) {
        return { reason: fromCode, message: data.message || null };
    }

    const fromMessage = reasonFromAccessMessage(data.message);
    if (fromMessage) {
        return { reason: fromMessage, message: data.message || null };
    }

    return null;
}

export function shouldHandleTenantAccessRedirect() {
    return !isMasterHost() && !window.location.pathname.startsWith('/acceso-bloqueado');
}

export function redirectToTenantAccessBlocked(reason, message) {
    const params = new URLSearchParams();
    if (reason) {
        params.set('reason', reason);
    }
    if (message) {
        params.set('msg', message);
    }
    const qs = params.toString();
    window.location.replace(`/acceso-bloqueado${qs ? `?${qs}` : ''}`);
}
