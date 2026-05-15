import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { setToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function LoginClientePage() {
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
            navigate('/blank', { replace: true });
        } catch (err) {
            setError(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.20),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.18),transparent_60%)]" />

            <div className="relative mx-auto max-w-6xl px-6 py-10 min-h-screen flex items-center">
                <div className="absolute top-6 right-6 z-10">
                    <ThemeToggle />
                </div>
                <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1 text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            Acceso clientes
                        </div>

                        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900 dark:text-neutral-50">
                            Bienvenido a <span className="text-amber-300">Proyecto Restaurante</span>
                        </h1>
                        <p className="mt-4 text-stone-700 dark:text-neutral-300 leading-relaxed max-w-prose">
                            Inicia sesión para reservar mesa, ver tu historial y pedir ayuda a un mesero. (Por ahora es un
                            demo para validar la API).
                        </p>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md">
                        <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-white/5 p-6 shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-stone-900 dark:text-neutral-50">Iniciar sesión</div>
                                    <div className="text-sm text-stone-700 dark:text-neutral-300">Cliente</div>
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
                                            'mt-2 w-full rounded-xl bg-white/70 dark:bg-neutral-950/30 border px-3 py-2.5 outline-none',
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
                                            'mt-2 w-full rounded-xl bg-white/70 dark:bg-neutral-950/30 border px-3 py-2.5 outline-none',
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
                                        'w-full rounded-xl px-4 py-2.5 font-medium',
                                        'bg-amber-400/90 text-neutral-950 hover:bg-amber-400',
                                        'disabled:opacity-60 disabled:cursor-not-allowed',
                                    )}
                                >
                                    {loading ? 'Ingresando...' : 'Entrar'}
                                </button>

                                <div className="text-xs text-stone-600 dark:text-neutral-400">
                                    Este login es solo para <span className="text-stone-800 dark:text-neutral-200">CLIENTE</span>.{' '}
                                    <Link className="text-amber-400/90 hover:text-amber-300" to="/login-cocina">
                                        Cocina
                                    </Link>
                                    {' · '}
                                    <Link className="text-emerald-400/90 hover:text-emerald-300" to="/login-mesero">
                                        Meseros
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

