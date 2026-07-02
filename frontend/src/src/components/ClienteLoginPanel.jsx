import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { setToken } from '../auth/authStorage';
import { clearSessionEndedState } from '../auth/sessionNavigation';
import { useSessionEndedNotice } from '../auth/useSessionEndedNotice';
import { getTenantSlugForApi } from '../tenancy/tenantContext';
import { PasswordInput } from './PasswordInput';
import { RestarantinoLogo } from './RestarantinoLogo';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const inputClass =
    'mt-1.5 w-full min-h-[44px] rounded-xl bg-white/70 dark:bg-neutral-950/30 border px-3 py-2.5 outline-none text-base sm:text-sm border-stone-200 dark:border-white/10 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10';

/**
 * Login y registro de clientes (landing, /cliente/login).
 */
export function ClienteLoginPanel({
    redirectPath = '/cliente/carta',
    subtitle = 'Cliente',
    onSuccess,
}) {
    const navigate = useNavigate();
    const [modo, setModo] = useState('login');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [cedula, setCedula] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const sessionEndedNotice = useSessionEndedNotice();

    const deviceName = useMemo(() => `web-${navigator.platform || 'browser'}`, []);
    const tenantSlug = useMemo(() => getTenantSlugForApi(), []);

    function cambiarModo(next) {
        setModo(next);
        setError('');
        setPassword('');
        setPasswordConfirm('');
    }

    function irAGoogle() {
        const dest = redirectPath ?? '/cliente';
        const tenant = getTenantSlugForApi();
        // Ir directo al backend evita problemas de cookies entre localhost:5173 y 127.0.0.1:8000
        const apiOrigin = import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';
        const params = new URLSearchParams({ redirect: dest });
        if (tenant) {
            params.set('tenant', tenant);
        }
        window.location.href = `${apiOrigin}/auth/google/cliente?${params.toString()}`;
    }

    function completarSesion(data) {
        if (!data?.token) {
            throw new Error('No llegó el token de sesión.');
        }
        setToken(data.token);
        clearSessionEndedState();
        onSuccess?.(data);
        if (redirectPath) {
            navigate(redirectPath, { replace: true });
        }
    }

    async function onSubmitLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch('/api/auth/login-cliente', {
                method: 'POST',
                body: JSON.stringify({ correo, password, device_name: deviceName }),
            });
            completarSesion(data);
        } catch (err) {
            const msg = err?.message || 'No se pudo iniciar sesión.';
            if (err?.status === 403 && err?.data?.message?.includes('solo para CLIENTE')) {
                setError('Este correo es de personal del restaurante. Usa /staff para entrar como empleado.');
            } else if (err?.status === 400 && !tenantSlug) {
                setError('No se identificó el restaurante. Abre el sitio desde el subdominio de tu local o configura VITE_DEV_TENANT_SLUG.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }

    async function onSubmitRegister(e) {
        e.preventDefault();
        setError('');
        if (password !== passwordConfirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        setLoading(true);
        try {
            const body = {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                correo: correo.trim(),
                telefono: telefono.trim(),
                password,
                password_confirmation: passwordConfirm,
                device_name: deviceName,
            };
            const ced = cedula.trim();
            if (ced) body.cedula = ced;

            const data = await apiFetch('/api/auth/register-cliente', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            completarSesion(data);
        } catch (err) {
            setError(err?.message || 'No se pudo crear la cuenta.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-base sm:text-lg font-semibold text-stone-900 dark:text-neutral-50">
                        {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </div>
                    <div className="text-xs sm:text-sm text-stone-700 dark:text-neutral-300">{subtitle}</div>
                </div>
                <RestarantinoLogo size="sm" className="max-w-[5.5rem]" />
            </div>

            <div className="mt-4 flex rounded-xl border border-stone-200 dark:border-white/10 p-0.5 bg-stone-50 dark:bg-neutral-950/50">
                <button
                    type="button"
                    onClick={() => cambiarModo('login')}
                    className={classNames(
                        'flex-1 rounded-[10px] py-2 text-xs sm:text-sm font-semibold transition-colors',
                        modo === 'login'
                            ? 'bg-amber-400/90 text-neutral-950 shadow-sm'
                            : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200',
                    )}
                >
                    Entrar
                </button>
                <button
                    type="button"
                    onClick={() => cambiarModo('register')}
                    className={classNames(
                        'flex-1 rounded-[10px] py-2 text-xs sm:text-sm font-semibold transition-colors',
                        modo === 'register'
                            ? 'bg-amber-400/90 text-neutral-950 shadow-sm'
                            : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200',
                    )}
                >
                    Registrarse
                </button>
            </div>

            <button
                type="button"
                disabled={loading}
                onClick={irAGoogle}
                className={classNames(
                    'mt-4 w-full min-h-[44px] rounded-xl border border-stone-200 dark:border-white/15',
                    'bg-white dark:bg-neutral-950/50 px-4 py-2.5 font-medium text-sm text-stone-800 dark:text-neutral-100',
                    'hover:bg-stone-50 dark:hover:bg-white/5 disabled:opacity-60 flex items-center justify-center gap-2.5',
                )}
            >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Continuar con Google
            </button>

            <div className="relative my-4">
                <div className="border-t border-stone-200 dark:border-white/10" aria-hidden />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 px-2 text-xs text-stone-500 dark:text-neutral-500">
                    o con correo
                </span>
            </div>

            {modo === 'login' ? (
                <form className="mt-4 space-y-3" onSubmit={onSubmitLogin}>
                    <div>
                        <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Correo</label>
                        <input
                            className={inputClass}
                            type="email"
                            autoComplete="email"
                            required
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="tu@correo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">
                            Contraseña
                        </label>
                        <PasswordInput
                            className={inputClass}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    {sessionEndedNotice ? (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                            {sessionEndedNotice}
                        </div>
                    ) : null}
                    {error ? (
                        <div className="rounded-xl border border-red-500/25 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className={classNames(
                            'w-full min-h-[44px] rounded-xl px-4 py-3 font-medium text-base sm:text-sm touch-manipulation',
                            'bg-amber-400/90 text-neutral-950 hover:bg-amber-400 disabled:opacity-60',
                        )}
                    >
                        {loading ? 'Ingresando…' : 'Entrar'}
                    </button>
                </form>
            ) : (
                <form className="mt-4 space-y-3" onSubmit={onSubmitRegister}>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">
                                Nombre
                            </label>
                            <input
                                className={inputClass}
                                required
                                maxLength={120}
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                autoComplete="given-name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">
                                Apellido
                            </label>
                            <input
                                className={inputClass}
                                required
                                maxLength={120}
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                autoComplete="family-name"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">Correo</label>
                        <input
                            className={inputClass}
                            type="email"
                            required
                            autoComplete="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="tu@correo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">Teléfono</label>
                        <input
                            className={inputClass}
                            type="tel"
                            required
                            maxLength={40}
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            autoComplete="tel"
                            placeholder="300 000 0000"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">
                            Cédula <span className="text-stone-500 font-normal">(opcional)</span>
                        </label>
                        <input
                            className={inputClass}
                            maxLength={32}
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            placeholder="Si no la pones, se genera un ID interno"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">
                            Contraseña <span className="text-stone-500 font-normal">(mín. 8)</span>
                        </label>
                        <PasswordInput
                            className={inputClass}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-800 dark:text-neutral-200">
                            Confirmar contraseña
                        </label>
                        <PasswordInput
                            className={inputClass}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>
                    {sessionEndedNotice ? (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                            {sessionEndedNotice}
                        </div>
                    ) : null}
                    {error ? (
                        <div className="rounded-xl border border-red-500/25 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className={classNames(
                            'w-full min-h-[44px] rounded-xl px-4 py-3 font-medium text-base sm:text-sm touch-manipulation',
                            'bg-amber-400/90 text-neutral-950 hover:bg-amber-400 disabled:opacity-60',
                        )}
                    >
                        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                    </button>
                </form>
            )}

        </>
    );
}
