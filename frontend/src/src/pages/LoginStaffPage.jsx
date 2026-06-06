import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { parseStaffRolFromQuery } from '../auth/staffLogin';
import { setToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const STAFF_ROLES = {
    ADMINISTRADOR: {
        key: 'ADMINISTRADOR',
        label: 'Administrador',
        short: 'A',
        query: 'admin',
        endpoint: '/api/auth/login',
        redirect: '/admin/dashboard',
        avatarClass: 'bg-amber-600/20 border-amber-500/30 text-amber-900 dark:text-amber-200',
    },
    MESERO: {
        key: 'MESERO',
        label: 'Mesero',
        short: 'M',
        query: 'mesero',
        endpoint: '/api/auth/login-mesero',
        redirect: '/mesero',
        avatarClass: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-800 dark:text-emerald-200',
    },
    COCINERO: {
        key: 'COCINERO',
        label: 'Cocina',
        short: 'K',
        query: 'cocina',
        endpoint: '/api/auth/login-cocina',
        redirect: '/cocina',
        avatarClass: 'bg-orange-500/20 border-orange-400/30 text-orange-800 dark:text-orange-200',
    },
};

const DEMO_CREDENTIALS = {
    ADMINISTRADOR: { correo: 'admin@gmail.com', password: 'adminn' },
    MESERO: { correo: 'mesero@gmail.com', password: 'meseroo' },
    COCINERO: { correo: 'cocinero@gmail.com', password: 'cocineroo' },
};

const ROLE_ORDER = ['ADMINISTRADOR', 'MESERO', 'COCINERO'];

const LOGIN_STEPS = [
    'Elige tu rol en el formulario: Administrador, Mesero o Cocina.',
    'Escribe el correo y la contraseña que te asignó el restaurante.',
    'Pulsa Entrar y accederás directo a tu área de trabajo.',
];

export function LoginStaffPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialRol = parseStaffRolFromQuery(searchParams);
    const [rol, setRol] = useState(initialRol);
    const config = STAFF_ROLES[rol];
    const demo = DEMO_CREDENTIALS[rol];

    const [correo, setCorreo] = useState(demo.correo);
    const [password, setPassword] = useState(demo.password);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deviceName = useMemo(() => `${config.query}-${navigator.platform || 'web'}`, [config.query]);

    function onRolChange(nextRol) {
        setRol(nextRol);
        setError('');
        const creds = DEMO_CREDENTIALS[nextRol];
        setCorreo(creds.correo);
        setPassword(creds.password);
        setSearchParams({ rol: STAFF_ROLES[nextRol].query }, { replace: true });
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch(config.endpoint, {
                method: 'POST',
                body: JSON.stringify({ correo, password, device_name: deviceName }),
            });

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
                            Un solo inicio de sesión para administración, salón y cocina.
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

                    <div className="lg:justify-self-end w-full max-w-md relative z-10">
                        <div className="rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/92 dark:bg-stone-950/55 p-6 shadow-lg shadow-stone-900/5 dark:shadow-black/30 backdrop-blur-md">
                            <div className="flex items-center justify-between">
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
                                        'h-10 w-10 rounded-xl border flex items-center justify-center font-bold',
                                        config.avatarClass,
                                    )}
                                >
                                    {config.short}
                                </div>
                            </div>

                            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label
                                        htmlFor="staff-rol"
                                        className="block text-sm font-medium text-stone-700 dark:text-stone-200"
                                    >
                                        Rol
                                    </label>
                                    <select
                                        id="staff-rol"
                                        value={rol}
                                        onChange={(e) => onRolChange(e.target.value)}
                                        className={classNames(
                                            'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5 text-stone-900 dark:text-stone-50',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                        )}
                                    >
                                        {ROLE_ORDER.map((key) => (
                                            <option key={key} value={key}>
                                                {STAFF_ROLES[key].label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                                        Correo
                                    </label>
                                    <input
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
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        className={classNames(
                                            'mt-2 w-full rounded-xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 px-3 py-2.5 text-stone-900 dark:text-stone-50',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
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
                                        'w-full rounded-xl px-4 py-2.5 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                                        'bg-orange-700 hover:bg-orange-600 text-stone-50',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                                    )}
                                >
                                    {loading ? 'Ingresando…' : 'Entrar'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
