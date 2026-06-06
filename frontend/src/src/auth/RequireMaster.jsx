import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { masterApiFetch } from './masterApiClient';
import { clearMasterToken, getMasterToken } from './masterAuthStorage';

export function RequireMaster({ children }) {
    const navigate = useNavigate();
    const [ok, setOk] = useState(null);

    useEffect(() => {
        const token = getMasterToken();
        if (!token) {
            setOk(false);
            navigate('/master/login', { replace: true });
            return;
        }

        let cancelled = false;
        masterApiFetch('/api/master/auth/me')
            .then(() => {
                if (!cancelled) setOk(true);
            })
            .catch(() => {
                if (cancelled) return;
                clearMasterToken();
                setOk(false);
                navigate('/master/login', { replace: true });
            });

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    if (ok === null) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center text-stone-600 dark:text-stone-400 text-lg">
                Cargando Master…
            </div>
        );
    }

    if (!ok) return <Navigate to="/master/login" replace />;

    return children;
}
