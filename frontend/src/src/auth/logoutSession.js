import { apiFetch } from './apiClient';
import { clearToken, getToken } from './authStorage';
import { clearMasterToken, getMasterToken } from './masterAuthStorage';
import { masterApiFetch } from './masterApiClient';

/**
 * Cierra sesión en el servidor (Sanctum) y borra el token local.
 * Ignora errores de red o token ya inválido.
 */
export async function logoutTenantSession() {
    try {
        if (getToken()) {
            await apiFetch('/api/auth/logout', { method: 'POST' });
        }
    } catch {
        /* sesión ya inválida o sin red */
    }
    clearToken();
}

export async function logoutMasterSession() {
    try {
        if (getMasterToken()) {
            await masterApiFetch('/api/master/auth/logout', { method: 'POST' });
        }
    } catch {
        /* ignore */
    }
    clearMasterToken();
}
