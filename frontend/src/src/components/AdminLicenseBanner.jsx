import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';

export function AdminLicenseBanner() {
    const [info, setInfo] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const res = await apiFetch('/api/admin/licencia');
                if (!cancelled) {
                    setInfo(res?.data ?? null);
                }
            } catch {
                if (!cancelled) {
                    setInfo(null);
                }
            }
        }

        void load();
        const id = setInterval(() => void load(), 60 * 60 * 1000);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    if (!info?.show_warning || !info?.message) {
        return null;
    }

    const urgent = typeof info.days_remaining === 'number' && info.days_remaining <= 3;

    return (
        <div
            className={
                urgent
                    ? 'border-b border-red-500/30 bg-red-50 dark:bg-red-950/40 px-6 py-3'
                    : 'border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-6 py-3'
            }
            role="status"
        >
            <p
                className={
                    urgent
                        ? 'text-sm text-red-800 dark:text-red-200 leading-relaxed'
                        : 'text-sm text-amber-900 dark:text-amber-100 leading-relaxed'
                }
            >
                <span className="font-semibold">Licencia por vencer: </span>
                {info.message}{' '}
                <Link
                    to="/admin/configuracion#suscripcion"
                    className={
                        urgent
                            ? 'font-semibold underline underline-offset-2 hover:text-red-950 dark:hover:text-red-100'
                            : 'font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-50'
                    }
                >
                    Renovar suscripción
                </Link>
            </p>
        </div>
    );
}
