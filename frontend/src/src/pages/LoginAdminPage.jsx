import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { setToken } from '../auth/authStorage';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function LoginAdminPage() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('admin@gmail.com');
    const [password, setPassword] = useState('adminn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deviceName = useMemo(() => `admin-${navigator.platform || 'web'}`, []);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ correo, password, device_name: deviceName }),
            });

            if (!data?.token) throw new Error('Login OK, pero no llegó token.');

            setToken(data.token);
            navigate('/admin/productos', { replace: true });
        } catch (err) {
            setError(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-50">
            <div className="mx-auto max-w-6xl px-6 py-10 min-h-screen flex items-center">
                <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-3 py-1 text-sm text-stone-400">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Panel administrador
                        </div>

                        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
                            Gestiona el <span className="text-amber-500">menú</span>
                        </h1>
                        <p className="mt-4 text-stone-400 leading-relaxed max-w-prose">
                            Crea, edita, deshabilita o elimina productos. Recuerda: un producto con pedidos no se elimina; se
                            desactiva.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
                            <Link className="text-amber-500 hover:text-amber-400" to="/login">
                                Acceso clientes
                            </Link>
                            <Link className="text-amber-500 hover:text-amber-400" to="/login-mesero">
                                Acceso meseros
                            </Link>
                            <Link className="text-amber-500 hover:text-amber-400" to="/login-cocina">
                                Acceso cocina
                            </Link>
                        </div>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md">
                        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold">Iniciar sesión</div>
                                    <div className="text-sm text-stone-400">Rol administrador</div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-200 font-bold">
                                    A
                                </div>
                            </div>

                            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-stone-400">Correo</label>
                                    <input
                                        className={classNames(
                                            'mt-2 w-full rounded-lg bg-stone-900 border border-stone-800 px-4 py-2 text-stone-50 placeholder:text-stone-500',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                        )}
                                        autoComplete="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-400">Contraseña</label>
                                    <input
                                        type="password"
                                        className={classNames(
                                            'mt-2 w-full rounded-lg bg-stone-900 border border-stone-800 px-4 py-2 text-stone-50 placeholder:text-stone-500',
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

                                <div className="text-xs text-stone-500">
                                    Solo usuarios con rol <span className="text-stone-400">ADMINISTRADOR</span>.
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

