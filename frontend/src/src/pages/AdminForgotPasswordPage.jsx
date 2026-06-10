import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { ThemeToggle } from '../theme/ThemeToggle';
import { getTenantSlugForApi } from '../tenancy/tenantContext';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function AdminForgotPasswordPage() {
    const tenantSlug = useMemo(() => getTenantSlugForApi(), []);
    const [correo, setCorreo] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resetLink, setResetLink] = useState('');

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        setResetLink('');
        setLoading(true);

        try {
            const res = await apiFetch('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ correo: correo.trim() }),
            });
            setMessage(res?.message || 'Revisa tu correo si eres administrador del restaurante.');
            setResetLink(res?.reset_url || '');
        } catch (err) {
            if (err?.status === 429) {
                setMessage(err?.message || 'Demasiados intentos. Espera un minuto.');
            } else {
                setError(err?.message || 'No se pudo enviar el enlace.');
            }
            if (err?.data?.reset_url) {
                setResetLink(err.data.reset_url);
            }
        } finally {
            setLoading(false);
        }
    }

    function copiarEnlace() {
        if (!resetLink) return;
        void navigator.clipboard?.writeText(resetLink);
        setMessage('Enlace copiado. Ábrelo en esta pestaña para definir tu nueva contraseña.');
    }

    return (
        <div className="relative min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            <div className="relative z-10 mx-auto max-w-md px-6 py-16 min-h-screen flex items-center">
                <div className="w-full rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/92 dark:bg-stone-950/55 p-6 shadow-lg backdrop-blur-md">
                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-50">Recuperar contraseña</div>
                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                        Solo para administradores del restaurante. Te enviaremos un enlace si el correo está registrado.
                    </p>

                    {tenantSlug ? (
                        <p className="mt-3 text-xs text-stone-500">
                            Restaurante: <strong className="text-stone-700 dark:text-stone-300">{tenantSlug}</strong>
                        </p>
                    ) : (
                        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                            Entra desde el subdominio de tu restaurante para recuperar la contraseña del admin.
                        </p>
                    )}

                    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                        <div>
                            <label htmlFor="forgot-correo" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                                Correo del administrador
                            </label>
                            <input
                                id="forgot-correo"
                                type="email"
                                required
                                autoComplete="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                className="mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5"
                            />
                        </div>

                        {message ? (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                                {message}
                            </div>
                        ) : null}

                        {resetLink ? (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                                <p className="text-xs text-amber-900 dark:text-amber-100">
                                    Enlace de recuperación (si el correo no llegó):
                                </p>
                                <p className="text-xs break-all text-stone-700 dark:text-stone-300">{resetLink}</p>
                                <button
                                    type="button"
                                    onClick={copiarEnlace}
                                    className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline"
                                >
                                    Copiar enlace
                                </button>
                            </div>
                        ) : null}

                        {error ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading || !tenantSlug}
                            className={classNames(
                                'w-full rounded-xl px-4 py-3 font-semibold bg-orange-700 hover:bg-orange-600 text-stone-50',
                                'disabled:opacity-60 disabled:cursor-not-allowed',
                            )}
                        >
                            {loading ? 'Enviando…' : 'Enviar enlace'}
                        </button>
                    </form>

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
