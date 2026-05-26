import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { setToken } from '../auth/authStorage';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

/**
 * Formulario de login cliente (/cliente/login). Ver la carta no requiere sesión (ruta /cliente/carta).
 */
export function ClienteLoginPanel({
    redirectPath = '/cliente/carta',
    subtitle = 'Cliente',
}) {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('cliente@gmail.com');
    const [password, setPassword] = useState('clientee');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deviceName = useMemo(() => `web-${navigator.platform || 'browser'}`, []);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/api/auth/login-cliente', {
                method: 'POST',
                body: JSON.stringify({ correo, password, device_name: deviceName }),
            });

            if (!data?.token) {
                throw new Error('Login OK, pero no llegó token.');
            }

            setToken(data.token);
            navigate(redirectPath, { replace: true });
        } catch (err) {
            setError(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-base sm:text-lg font-semibold text-stone-900 dark:text-neutral-50">Iniciar sesión</div>
                    <div className="text-xs sm:text-sm text-stone-700 dark:text-neutral-300">{subtitle}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-400/15 border border-amber-300/20 flex items-center justify-center">
                    <span className="text-amber-800 dark:text-amber-200 font-bold">R</span>
                </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div>
                    <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Correo</label>
                    <input
                        className={classNames(
                            'mt-2 w-full min-h-[44px] rounded-xl bg-white/70 dark:bg-neutral-950/30 border px-3 py-2.5 outline-none text-base sm:text-sm',
                            'border-stone-200 dark:border-white/10 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10',
                        )}
                        autoComplete="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="cliente@correo.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Contraseña</label>
                    <input
                        type="password"
                        className={classNames(
                            'mt-2 w-full min-h-[44px] rounded-xl bg-white/70 dark:bg-neutral-950/30 border px-3 py-2.5 outline-none text-base sm:text-sm',
                            'border-stone-200 dark:border-white/10 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10',
                        )}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>

                {error ? (
                    <div className="rounded-xl border border-red-500/25 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                        {error}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={loading}
                    className={classNames(
                        'w-full min-h-[44px] rounded-xl px-4 py-3 sm:py-2.5 font-medium text-base sm:text-sm touch-manipulation',
                        'bg-amber-400/90 text-neutral-950 hover:bg-amber-400',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                    )}
                >
                    {loading ? 'Ingresando...' : 'Entrar'}
                </button>
            </form>
        </>
    );
}
