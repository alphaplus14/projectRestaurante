import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiFetch } from './apiClient';
import { staffLoginUrl } from './staffLogin';
import { clearToken, getToken } from './authStorage';

export function RequireCocina({ children }) {
    const navigate = useNavigate();
    const [ok, setOk] = useState(null);
    const loginPath = staffLoginUrl('COCINERO');

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
                if (data?.user?.rol !== 'COCINERO') {
                    clearToken();
                    setOk(false);
                    navigate(loginPath, { replace: true });
                    return;
                }
                setOk(true);
            })
            .catch(() => {
                if (cancelled) return;
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
                Cargando cocina…
            </div>
        );
    }

    if (!ok) return <Navigate to={loginPath} replace />;

    return children;
}
