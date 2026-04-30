import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { setToken } from '../auth/authStorage';

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
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.20),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.18),transparent_60%)]" />

            <div className="relative mx-auto max-w-6xl px-6 py-10 min-h-screen flex items-center">
                <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            Acceso clientes
                        </div>

                        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
                            Bienvenido a <span className="text-amber-300">Proyecto Restaurante</span>
                        </h1>
                        <p className="mt-4 text-neutral-300 leading-relaxed max-w-prose">
                            Inicia sesión para reservar mesa, ver tu historial y pedir ayuda a un mesero. (Por ahora es un
                            demo para validar la API).
                        </p>

                        <div className="mt-8 flex gap-3 text-sm text-neutral-300">
                            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                                <div className="font-medium text-neutral-100">Tip rápido</div>
                                <div className="mt-1">
                                    Usa <span className="text-neutral-100">cliente@gmail.com</span> /{' '}
                                    <span className="text-neutral-100">clientee</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold">Iniciar sesión</div>
                                    <div className="text-sm text-neutral-300">Cliente</div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-amber-400/15 border border-amber-300/20 flex items-center justify-center">
                                    <span className="text-amber-200 font-bold">R</span>
                                </div>
                            </div>

                            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-200">Correo</label>
                                    <input
                                        className={classNames(
                                            'mt-2 w-full rounded-xl bg-neutral-950/30 border px-3 py-2.5 outline-none',
                                            'border-white/10 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10',
                                        )}
                                        autoComplete="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        placeholder="cliente@correo.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-200">Contraseña</label>
                                    <input
                                        type="password"
                                        className={classNames(
                                            'mt-2 w-full rounded-xl bg-neutral-950/30 border px-3 py-2.5 outline-none',
                                            'border-white/10 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10',
                                        )}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>

                                {error ? (
                                    <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
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

                                <div className="text-xs text-neutral-400">
                                    Este login es solo para <span className="text-neutral-200">CLIENTE</span>.
                                </div>
                            </form>
                        </div>

                        <div className="mt-4 text-center text-xs text-neutral-500">
                            Restaurante demo • Tailwind + React
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

