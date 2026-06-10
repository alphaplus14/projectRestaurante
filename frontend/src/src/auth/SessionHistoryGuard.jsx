import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from './apiClient';
import { getToken } from './authStorage';
import { getMasterToken } from './masterAuthStorage';
import { logoutMasterSession, logoutTenantSession } from './logoutSession';
import {
    isMasterLoginPath,
    isProtectedMasterPath,
    isProtectedTenantPath,
    isTenantLoginPath,
    markSessionEnded,
    tenantLoginUrlForPath,
} from './sessionNavigation';

/**
 * Evita estados rotos al usar Atrás/Adelante del navegador:
 * - Si vuelven al login con sesión activa → cierra sesión.
 * - Si restauran una página protegida desde caché (bfcache) → revalida o redirige al login.
 */
export function SessionHistoryGuard({ children }) {
    const location = useLocation();
    const handlingRef = useRef(false);

    useEffect(() => {
        const path = location.pathname;

        if (isTenantLoginPath(path) && getToken()) {
            if (handlingRef.current) return;
            handlingRef.current = true;
            void (async () => {
                try {
                    await logoutTenantSession();
                    markSessionEnded();
                } finally {
                    handlingRef.current = false;
                }
            })();
            return;
        }

        if (isMasterLoginPath(path) && getMasterToken()) {
            if (handlingRef.current) return;
            handlingRef.current = true;
            void (async () => {
                try {
                    await logoutMasterSession();
                    markSessionEnded();
                } finally {
                    handlingRef.current = false;
                }
            })();
        }
    }, [location.pathname]);

    useEffect(() => {
        function onPageShow(event) {
            if (!event.persisted) return;

            const path = window.location.pathname;

            if (isProtectedTenantPath(path)) {
                const token = getToken();
                if (!token) {
                    markSessionEnded();
                    window.location.replace(tenantLoginUrlForPath(path));
                    return;
                }

                void apiFetch('/api/auth/me').catch(async () => {
                    await logoutTenantSession();
                    markSessionEnded();
                    window.location.replace(tenantLoginUrlForPath(path));
                });
            }

            if (isProtectedMasterPath(path)) {
                if (!getMasterToken()) {
                    markSessionEnded();
                    window.location.replace('/master/login');
                }
            }
        }

        window.addEventListener('pageshow', onPageShow);
        return () => window.removeEventListener('pageshow', onPageShow);
    }, []);

    return children;
}
