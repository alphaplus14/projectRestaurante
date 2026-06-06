import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken, setToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';
import { getTenantSlugForApi } from '../tenancy/tenantContext';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function LoginAdminPage() {
    const navigate = useNavigate();
    const tenantSlug = useMemo(() => getTenantSlugForApi(), []);
    const isTenantApp = Boolean(tenantSlug);
    const [correo, setCorreo] = useState(isTenantApp ? '' : 'admin@gmail.com');
    const [password, setPassword] = useState(isTenantApp ? '' : 'adminn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deviceName = useMemo(() => `admin-${navigator.platform || 'web'}`, []);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('admin_login_error');
            if (stored) {
                setError(stored);
                sessionStorage.removeItem('admin_login_error');
                clearToken();
            }
        } catch {
            /* ignore */
        }
    }, []);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/api/auth/login-admin', {
                method: 'POST',
                body: JSON.stringify({ correo, password, device_name: deviceName }),
            });

            if (!data?.token) throw new Error('Login OK, pero no llegó token.');

            setToken(data.token);
            navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            setError(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
            <div className="absolute top-6 right-6 z-10">
                <ThemeToggle />
            </div>
            <div className="mx-auto max-w-6xl px-6 py-10 min-h-screen flex items-center">
                <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1 text-sm text-stone-600 dark:text-stone-400">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Panel administrador
                        </div>

                        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
                            Gestiona el <span className="text-amber-500">menú</span>
                        </h1>
                        <p className="mt-4 text-stone-600 dark:text-stone-400 leading-relaxed max-w-prose">
                            Crea, edita, deshabilita o elimina productos. Recuerda: un producto con pedidos no se elimina; se
                            desactiva.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            <Link className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200" to="/staff">
                                Portal del personal
                            </Link>
                            <Link className="text-amber-600 dark:text-amber-400 hover:text-amber-500" to="/cliente">
                                Sitio para clientes
                            </Link>
                        </div>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md">
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-50">Iniciar sesión</div>
                                    <div className="text-sm text-stone-600 dark:text-stone-400">Rol administrador</div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-900 dark:text-amber-200 font-bold">
                                    A
                                </div>
                            </div>

                            {!tenantSlug ? (
                                <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                                    No se detectó el restaurante. Entra desde tu subdominio, por ejemplo{' '}
                                    <a href="http://turestaurante.localhost:5173/login-admin" className="underline font-medium">
                                        turestaurante.localhost:5173/login-admin
                                    </a>
                                    .
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/50 px-3 py-2 text-xs text-stone-600 dark:text-stone-400">
                                    Restaurante activo: <strong className="text-stone-800 dark:text-stone-200">{tenantSlug}</strong>
                                </div>
                            )}

                            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Correo</label>
                                    <input
                                        className={classNames(
                                            'mt-2 w-full rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-2 text-stone-900 dark:text-stone-50 placeholder:text-stone-500',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                        )}
                                        autoComplete="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">Contraseña</label>
                                    <input
                                        type="password"
                                        className={classNames(
                                            'mt-2 w-full rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-2 text-stone-900 dark:text-stone-50 placeholder:text-stone-500',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                        )}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                {error ? (
                                    <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                                        {error}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={classNames(
                                        'w-full rounded-lg px-6 py-3 font-semibold transition-colors',
                                        'bg-orange-700 hover:bg-orange-600 text-stone-50',
                                        'focus-visible:ring-2 focus-visible:ring-amber-500',
                                        'disabled:opacity-60 disabled:cursor-not-allowed',
                                    )}
                                >
                                    {loading ? 'Ingresando…' : 'Entrar al panel'}
                                </button>

                                <div className="text-xs text-stone-600 dark:text-stone-500 space-y-1">
                                    <p>
                                        Solo usuarios con rol <span className="text-stone-600 dark:text-stone-400">ADMINISTRADOR</span>.
                                    </p>
                                    {isTenantApp ? (
                                        <p>
                                            Usa el correo y la contraseña que definiste al activar el restaurante
                                            {tenantSlug ? ` (${tenantSlug})` : ''}.
                                        </p>
                                    ) : (
                                        <p>Demo local: admin@gmail.com / adminn (solo BD plantilla sin tenant).</p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

