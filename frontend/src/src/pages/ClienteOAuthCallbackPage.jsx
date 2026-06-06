import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../auth/authStorage';

export function ClienteOAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [sinToken, setSinToken] = useState(false);

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            return;
        }

        const token = searchParams.get('token');
        if (!token) {
            setSinToken(true);
            return;
        }

        const redirect = searchParams.get('redirect') || '/cliente/carta';
        const destino = redirect.startsWith('/') ? redirect : '/cliente/carta';

        setToken(token);
        navigate(destino, { replace: true });
    }, [searchParams, navigate]);

    const errorParam = searchParams.get('error');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="max-w-md w-full rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 text-center shadow-sm">
                {errorParam ? (
                    <>
                        <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">{errorParam}</p>
                        <Link
                            to="/cliente/login"
                            className="mt-5 inline-block rounded-xl bg-amber-400/90 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                        >
                            Volver al login
                        </Link>
                    </>
                ) : sinToken ? (
                    <p className="text-red-700 dark:text-red-300 text-sm">
                        No se recibió el token de sesión. Intenta de nuevo.
                    </p>
                ) : (
                    <p className="text-stone-600 dark:text-neutral-400 text-sm">Completando inicio de sesión…</p>
                )}
            </div>
        </div>
    );
}
