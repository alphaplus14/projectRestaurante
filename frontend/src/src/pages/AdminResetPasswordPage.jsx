import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { ThemeToggle } from '../theme/ThemeToggle';
import { PasswordInput } from '../components/PasswordInput';
import { getTenantSlugForApi } from '../tenancy/tenantContext';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function AdminResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tenantSlug = useMemo(() => getTenantSlugForApi(), []);

    const token = searchParams.get('token') || '';
    const correoFromUrl = searchParams.get('correo') || '';

    const [correo, setCorreo] = useState(correoFromUrl);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const linkInvalid = !token;

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await apiFetch('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    correo: correo.trim(),
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });
            navigate('/staff?rol=admin', {
                replace: true,
                state: { resetSuccess: res?.message || 'Contraseña actualizada.' },
            });
        } catch (err) {
            setError(err?.message || 'No se pudo restablecer la contraseña.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            <div className="relative z-10 mx-auto max-w-md px-6 py-16 min-h-screen flex items-center">
                <div className="w-full rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/92 dark:bg-stone-950/55 p-6 shadow-lg backdrop-blur-md">
                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-50">Nueva contraseña</div>
                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                        Define una contraseña nueva para tu cuenta de administrador.
                    </p>

                    {tenantSlug ? (
                        <p className="mt-3 text-xs text-stone-500">
                            Restaurante: <strong>{tenantSlug}</strong>
                        </p>
                    ) : null}

                    {linkInvalid ? (
                        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-3 py-3 text-sm text-amber-900 dark:text-amber-100">
                            El enlace no es válido o está incompleto. Solicita uno nuevo desde el login de administrador.
                        </div>
                    ) : (
                        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                            <div>
                                <label htmlFor="reset-correo" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                                    Correo
                                </label>
                                <input
                                    id="reset-correo"
                                    type="email"
                                    required
                                    readOnly={Boolean(correoFromUrl)}
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    className="mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5"
                                />
                            </div>
                            <div>
                                <label htmlFor="reset-password" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                                    Nueva contraseña
                                </label>
                                <PasswordInput
                                    id="reset-password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5"
                                />
                            </div>
                            <div>
                                <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                                    Confirmar contraseña
                                </label>
                                <PasswordInput
                                    id="reset-password-confirm"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5"
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
                                    'w-full rounded-xl px-4 py-3 font-semibold bg-orange-700 hover:bg-orange-600 text-stone-50',
                                    'disabled:opacity-60 disabled:cursor-not-allowed',
                                )}
                            >
                                {loading ? 'Guardando…' : 'Guardar contraseña'}
                            </button>
                        </form>
                    )}

                    <p className="mt-5 text-center text-sm">
                        <Link to="/staff?rol=admin" className="text-amber-600 dark:text-amber-400 hover:underline">
                            Volver al inicio de sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
