import { apiFetch } from './apiClient';
import { clearToken, getToken } from './authStorage';

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
