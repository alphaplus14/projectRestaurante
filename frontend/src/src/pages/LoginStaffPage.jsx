import React, { useMemo, useState } from 'react';

import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { apiFetch } from '../auth/apiClient';

import {

    STAFF_ROLES,

    demoCredentialsForRol,

    parseStaffRolFromQuery,

} from '../auth/staffLogin';

import { setToken } from '../auth/authStorage';

import { ThemeToggle } from '../theme/ThemeToggle';

import { StaffRolePicker } from '../components/StaffRolePicker';
import { StaffRoleIcon } from '../components/StaffRoleIcons';
import { PasswordInput } from '../components/PasswordInput';

import { getTenantSlugForApi } from '../tenancy/tenantContext';



function classNames(...xs) {

    return xs.filter(Boolean).join(' ');

}



const LOGIN_STEPS = [

    'Elige tu área: Mesero (salón), Administrador, Cocina o Caja.',

    'Ingresa el correo y la contraseña que te asignó el restaurante.',

    'Pulsa el botón de acceso y entrarás directo a tu módulo.',

];



export function LoginStaffPage() {

    const navigate = useNavigate();

    const location = useLocation();

    const [searchParams, setSearchParams] = useSearchParams();

    const isTenantApp = useMemo(() => Boolean(getTenantSlugForApi()), []);

    const tenantSlug = useMemo(() => getTenantSlugForApi(), []);



    const initialRol = parseStaffRolFromQuery(searchParams);

    const [rol, setRol] = useState(initialRol);

    const config = STAFF_ROLES[rol];

    const initialCreds = demoCredentialsForRol(initialRol, isTenantApp);



    const [correo, setCorreo] = useState(initialCreds.correo);

    const [password, setPassword] = useState(initialCreds.password);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');

    const [loginStep, setLoginStep] = useState('credentials');

    const [challengeToken, setChallengeToken] = useState('');

    const [totpCode, setTotpCode] = useState('');

    const [useRecovery, setUseRecovery] = useState(false);

    const [recoveryCode, setRecoveryCode] = useState('');

    const resetSuccess = location.state?.resetSuccess || '';



    const deviceName = useMemo(() => `${config.query}-${navigator.platform || 'web'}`, [config.query]);



    function onRolChange(nextRol) {

        setRol(nextRol);

        setError('');

        const creds = demoCredentialsForRol(nextRol, isTenantApp);

        setCorreo(creds.correo);

        setPassword(creds.password);

        setLoginStep('credentials');

        setChallengeToken('');

        setTotpCode('');

        setUseRecovery(false);

        setRecoveryCode('');

        setSearchParams({ rol: STAFF_ROLES[nextRol].query }, { replace: true });

    }



    async function onSubmit(e) {

        e.preventDefault();

        setError('');

        setLoading(true);



        try {

            if (loginStep === 'two_factor' && rol === 'ADMINISTRADOR') {

                const data = await apiFetch('/api/auth/two-factor-challenge', {

                    method: 'POST',

                    body: JSON.stringify({

                        challenge_token: challengeToken,

                        code: useRecovery ? undefined : totpCode.trim(),

                        recovery_code: useRecovery ? recoveryCode.trim() : undefined,

                        device_name: deviceName,

                    }),

                });



                if (!data?.token) {

                    throw new Error('Verificación OK, pero no llegó token.');

                }



                setToken(data.token);

                navigate(config.redirect, { replace: true });

                return;

            }



            const data = await apiFetch(config.endpoint, {

                method: 'POST',

                body: JSON.stringify({ correo, password, device_name: deviceName }),

            });



            if (data?.two_factor && data?.challenge_token) {

                setChallengeToken(data.challenge_token);

                setLoginStep('two_factor');

                setTotpCode('');

                setRecoveryCode('');

                setUseRecovery(false);

                return;

            }



            if (!data?.token) {

                throw new Error('Login OK, pero no llegó token.');

            }



            setToken(data.token);

            navigate(config.redirect, { replace: true });

        } catch (err) {

            setError(err?.message || 'No se pudo iniciar sesión.');

        } finally {

            setLoading(false);

        }

    }



    return (

        <div className="relative min-h-screen overflow-hidden bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">

            <div className="pointer-events-none absolute inset-0" aria-hidden>

                <img

                    src="/restaurante_login_background.jpg"

                    alt=""

                    className="absolute inset-0 h-full w-full object-cover object-center"

                />

                <div

                    className="absolute inset-0 dark:hidden"

                    style={{

                        background:

                            'linear-gradient(to right, #f5f5f4 0%, rgba(245,245,244,0.94) 32%, rgba(245,245,244,0.55) 55%, rgba(245,245,244,0.12) 78%, transparent 100%)',

                    }}

                />

                <div

                    className="absolute inset-0 hidden dark:block"

                    style={{

                        background:

                            'linear-gradient(to right, #0c0a09 0%, rgba(12,10,9,0.95) 32%, rgba(12,10,9,0.6) 55%, rgba(12,10,9,0.15) 78%, transparent 100%)',

                    }}

                />

                <div className="absolute inset-0 bg-stone-950/0 dark:bg-stone-950/15" />

            </div>



            <div className="absolute top-6 right-6 z-20">

                <ThemeToggle />

            </div>



            <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 min-h-screen flex items-center">

                <div className="w-full grid lg:grid-cols-2 gap-10 items-center">

                    <div className="relative">

                        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">

                            Acceso del <span className="text-amber-600 dark:text-amber-400">personal</span>

                        </h1>

                        <p className="mt-4 text-stone-600 dark:text-stone-400 leading-relaxed max-w-prose">

                            Un solo inicio de sesión para salón, administración, cocina y caja.

                        </p>

                        <ol className="mt-5 space-y-3 max-w-prose">

                            {LOGIN_STEPS.map((paso, i) => (

                                <li

                                    key={i}

                                    className="flex gap-3 text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed"

                                >

                                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30">

                                        {i + 1}

                                    </span>

                                    <span>{paso}</span>

                                </li>

                            ))}

                        </ol>

                        <p className="mt-6 text-sm text-stone-600 dark:text-stone-400">

                            <Link className="text-amber-600 dark:text-amber-400 hover:underline" to="/cliente">

                                Sitio para clientes

                            </Link>

                            <span className="mx-2 text-stone-400">·</span>

                            El acceso de comensales sigue aparte.

                        </p>

                    </div>



                    <div className="lg:justify-self-end w-full max-w-lg relative z-10">

                        <div className="rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/92 dark:bg-stone-950/55 p-6 shadow-lg shadow-stone-900/5 dark:shadow-black/30 backdrop-blur-md">

                            <div className="flex items-center justify-between gap-3">

                                <div>

                                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-50">

                                        Iniciar sesión

                                    </div>

                                    <div className="text-sm text-stone-600 dark:text-stone-400">

                                        Personal del restaurante

                                    </div>

                                </div>

                                <div

                                    className={classNames(

                                        'h-11 w-11 rounded-xl border flex items-center justify-center shrink-0',

                                        config.avatarClass,

                                    )}

                                >

                                    <StaffRoleIcon roleKey={rol} className={config.iconClass} />

                                </div>

                            </div>



                            {tenantSlug ? (

                                <div className="mt-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/50 px-3 py-2 text-xs text-stone-600 dark:text-stone-400">

                                    Restaurante: <strong className="text-stone-800 dark:text-stone-200">{tenantSlug}</strong>

                                </div>

                            ) : null}



                            <form className="mt-6 space-y-5" onSubmit={onSubmit}>

                                {loginStep === 'credentials' ? (
                                    <StaffRolePicker value={rol} onChange={onRolChange} disabled={loading} />
                                ) : null}



                                {loginStep === 'credentials' ? (

                                <div className="space-y-4 pt-1 border-t border-stone-200/80 dark:border-white/10">

                                    <div>

                                        <label

                                            htmlFor="staff-correo"

                                            className="block text-sm font-medium text-stone-700 dark:text-stone-200"

                                        >

                                            Correo

                                        </label>

                                        <input

                                            id="staff-correo"

                                            className={classNames(

                                                'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5 text-stone-900 dark:text-stone-50',

                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',

                                            )}

                                            autoComplete="email"

                                            value={correo}

                                            onChange={(e) => setCorreo(e.target.value)}

                                        />

                                    </div>

                                    <div>

                                        <label

                                            htmlFor="staff-password"

                                            className="block text-sm font-medium text-stone-700 dark:text-stone-200"

                                        >

                                            Contraseña

                                        </label>

                                        <PasswordInput

                                            id="staff-password"

                                            className={classNames(

                                                'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5 text-stone-900 dark:text-stone-50',

                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',

                                            )}

                                            autoComplete="current-password"

                                            value={password}

                                            onChange={(e) => setPassword(e.target.value)}

                                        />

                                        {rol === 'ADMINISTRADOR' ? (
                                            <p className="mt-2 text-right">
                                                <Link
                                                    to="/staff/olvide-contrasena"
                                                    className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </Link>
                                            </p>
                                        ) : null}

                                    </div>

                                </div>

                                ) : (

                                <div className="space-y-4 pt-1 border-t border-stone-200/80 dark:border-white/10">

                                    <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/25 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">

                                        Verificación en dos pasos: ingresa el código de tu app de autenticación.

                                    </div>

                                    {!useRecovery ? (
                                        <div>
                                            <label
                                                htmlFor="staff-2fa-code"
                                                className="block text-sm font-medium text-stone-700 dark:text-stone-200"
                                            >
                                                Código de 6 dígitos
                                            </label>
                                            <input
                                                id="staff-2fa-code"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={6}
                                                value={totpCode}
                                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className={classNames(
                                                    'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5 text-center text-lg font-mono tracking-widest text-stone-900 dark:text-stone-50',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                                )}
                                                placeholder="000000"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label
                                                htmlFor="staff-recovery-code"
                                                className="block text-sm font-medium text-stone-700 dark:text-stone-200"
                                            >
                                                Código de recuperación
                                            </label>
                                            <input
                                                id="staff-recovery-code"
                                                autoComplete="off"
                                                value={recoveryCode}
                                                onChange={(e) => setRecoveryCode(e.target.value)}
                                                className={classNames(
                                                    'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5 font-mono text-stone-900 dark:text-stone-50',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                                )}
                                                placeholder="xxxx-xxxx"
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                                        onClick={() => {
                                            setUseRecovery((v) => !v);
                                            setTotpCode('');
                                            setRecoveryCode('');
                                            setError('');
                                        }}
                                    >
                                        {useRecovery ? 'Usar código de la app' : 'Usar código de recuperación'}
                                    </button>

                                    <button
                                        type="button"
                                        className="block text-xs text-stone-600 dark:text-stone-400 hover:underline"
                                        onClick={() => {
                                            setLoginStep('credentials');
                                            setChallengeToken('');
                                            setTotpCode('');
                                            setRecoveryCode('');
                                            setUseRecovery(false);
                                            setError('');
                                        }}
                                    >
                                        Volver al inicio de sesión
                                    </button>

                                </div>

                                )}



                                {resetSuccess ? (
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                                        {resetSuccess}
                                    </div>
                                ) : null}



                                {error ? (

                                    <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">

                                        {error}

                                    </div>

                                ) : null}



                                <button

                                    type="submit"

                                    disabled={loading}

                                    className={classNames(

                                        'w-full rounded-xl px-4 py-3 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',

                                        'bg-orange-700 hover:bg-orange-600 text-stone-50',

                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',

                                    )}

                                >

                                    {loading
                                        ? 'Ingresando…'
                                        : loginStep === 'two_factor'
                                          ? 'Verificar y entrar'
                                          : config.submitLabel}

                                </button>



                                {!isTenantApp ? (

                                    <p className="text-[11px] text-center text-stone-500 dark:text-stone-500">

                                        Demo local: credenciales de prueba según el rol seleccionado.

                                    </p>

                                ) : null}

                            </form>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}


