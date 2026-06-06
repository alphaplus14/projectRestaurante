import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiFetch } from './apiClient';
import { staffLoginUrl } from './staffLogin';
import { clearToken, getToken } from './authStorage';

export function RequireAdmin({ children }) {
    const navigate = useNavigate();
    const [ok, setOk] = useState(null);
    const loginPath = staffLoginUrl('ADMINISTRADOR');

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setOk(false);
            navigate(loginPath, { replace: true });
            return;
        }

        let cancelled = false;
        apiFetch('/api/auth/me')
            .then((data) => {
                if (cancelled) return;
                if (data?.user?.rol !== 'ADMINISTRADOR') {
                    try {
                        sessionStorage.setItem(
                            'admin_login_error',
                            data?.user?.rol
                                ? `Tu sesión es de rol ${data.user.rol}, no administrador. Cierra sesión e ingresa con el usuario admin.`
                                : 'Tu sesión no es de administrador.',
                        );
                    } catch {
                        /* ignore */
                    }
                    clearToken();
                    setOk(false);
                    navigate(loginPath, { replace: true });
                    return;
                }
                setOk(true);
            })
            .catch((err) => {
                if (cancelled) return;
                try {
                    const msg =
                        err?.status === 400
                            ? 'No se identificó el restaurante. Abre el login desde tu subdominio (ej. mi-local.localhost:5173).'
                            : err?.status === 401
                              ? 'La sesión expiró o el token no coincide con este restaurante. Vuelve a iniciar sesión.'
                              : 'No se pudo validar la sesión de administrador.';
                    sessionStorage.setItem('admin_login_error', msg);
                } catch {
                    /* ignore */
                }
                clearToken();
                setOk(false);
                navigate(loginPath, { replace: true });
            });

        return () => {
            cancelled = true;
        };
    }, [navigate, loginPath]);

    if (ok === null) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center text-stone-600 dark:text-stone-400 text-lg">
                Cargando panel…
            </div>
        );
    }

    if (!ok) return <Navigate to={loginPath} replace />;

    return children;
}
