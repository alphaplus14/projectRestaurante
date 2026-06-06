import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiFetch } from './apiClient';
import { clearToken, getToken } from './authStorage';
import { staffLoginUrl } from './staffLogin';

export function RequireCajero({ children }) {
    const navigate = useNavigate();
    const [ok, setOk] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setOk(false);
            navigate(staffLoginUrl('CAJERO'), { replace: true });
            return;
        }

        let cancelled = false;
        apiFetch('/api/auth/me')
            .then((data) => {
                if (cancelled) return;
                if (data?.user?.rol !== 'CAJERO') {
                    clearToken();
                    setOk(false);
                    navigate(staffLoginUrl('CAJERO'), { replace: true });
                    return;
                }
                setOk(true);
            })
            .catch(() => {
                if (cancelled) return;
                clearToken();
                setOk(false);
                navigate(staffLoginUrl('CAJERO'), { replace: true });
            });

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    if (ok === null) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center text-stone-600 dark:text-stone-400 text-lg">
                Cargando caja…
            </div>
        );
    }

    if (!ok) return <Navigate to={staffLoginUrl('CAJERO')} replace />;

    return children;
}
