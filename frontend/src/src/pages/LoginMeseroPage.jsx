import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { setToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function LoginMeseroPage() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('mesero@gmail.com');
    const [password, setPassword] = useState('meseroo');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deviceName = useMemo(() => `mesero-${navigator.platform || 'web'}`, []);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/api/auth/login-mesero', {
                method: 'POST',
                body: JSON.stringify({ correo, password, device_name: deviceName }),
            });

            if (!data?.token) {
                throw new Error('Login OK, pero no llegó token.');
            }

            setToken(data.token);
            navigate('/mesero', { replace: true });
        } catch (err) {
            setError(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
            <div className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.10),transparent_55%)]" />

            <div className="relative mx-auto max-w-6xl px-6 py-10 min-h-screen flex items-center">
                <div className="absolute top-6 right-6 z-10">
                    <ThemeToggle />
                </div>
                <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1 text-sm">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Terminal meseros
                        </div>

                        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                            Toma pedidos en <span className="text-emerald-400">el salón</span>
                        </h1>
                        <p className="mt-4 text-stone-700 dark:text-stone-300 leading-relaxed max-w-prose">
                            Elige mesa, abre la cuenta y envía ítems a cocina. Los pedidos aparecen en la pantalla de cocina en estado pendiente.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-600 dark:text-stone-500">
                            <Link className="text-amber-400/90 hover:text-amber-300" to="/login">
                                Acceso clientes
                            </Link>
                            <Link className="text-orange-400/90 hover:text-orange-300" to="/login-cocina">
                                Acceso cocina
                            </Link>
                        </div>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md">
                        <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-white/5 p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-50">Iniciar sesión</div>
                                    <div className="text-sm text-stone-600 dark:text-stone-400">Rol mesero</div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-bold">
                                    M
                                </div>
                            </div>

                            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">Correo</label>
                                    <input
                                        className={classNames(
                                            'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border px-3 py-2.5 outline-none',
                                            'border-stone-200 dark:border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15',
                                        )}
                                        autoComplete="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">Contraseña</label>
                                    <input
                                        type="password"
                                        className={classNames(
                                            'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border px-3 py-2.5 outline-none',
                                            'border-stone-200 dark:border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15',
                                        )}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                {error ? (
                                    <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                                        {error}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={classNames(
                                        'w-full rounded-xl px-4 py-2.5 font-medium',
                                        'bg-emerald-600 text-white hover:bg-emerald-500',
                                        'disabled:opacity-60 disabled:cursor-not-allowed',
                                    )}
                                >
                                    {loading ? 'Ingresando…' : 'Entrar a salón'}
                                </button>
                                <div className="text-xs text-stone-600 dark:text-stone-500">
                                    Solo usuarios con rol <span className="text-stone-700 dark:text-stone-300">MESERO</span>.
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
