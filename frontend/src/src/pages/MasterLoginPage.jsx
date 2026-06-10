import React, { useState } from 'react';
import { PasswordInput } from '../components/PasswordInput';
import { useNavigate } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { setMasterToken } from '../auth/masterAuthStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

export function MasterLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loginStep, setLoginStep] = useState('credentials');
    const [challengeToken, setChallengeToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    async function completarLogin(res) {
        setMasterToken(res.token);
        navigate('/master/dashboard', { replace: true });
    }

    async function onSubmitCredentials(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const res = await masterApiFetch('/api/master/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (res?.two_factor && res?.challenge_token) {
                setChallengeToken(res.challenge_token);
                setLoginStep('two_factor');
                return;
            }

            await completarLogin(res);
        } catch (err) {
            const msg = err?.message || 'No se pudo iniciar sesión.';
            const hint =
                err?.status === 0 || /fetch|conectar|network/i.test(msg)
                    ? ' ¿Está corriendo el backend? (php artisan serve en el puerto 8000)'
                    : /SQLSTATE|master_users|restaurante_master/i.test(msg)
                      ? ' Ejecuta en backend: php artisan master:migrate --seed'
                      : '';
            setError(msg + hint);
        } finally {
            setBusy(false);
        }
    }

    async function onSubmitTwoFactor(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const res = await masterApiFetch('/api/master/auth/two-factor-challenge', {
                method: 'POST',
                body: JSON.stringify({
                    challenge_token: challengeToken,
                    code: twoFactorCode.trim() || undefined,
                    recovery_code: recoveryCode.trim() || undefined,
                }),
            });
            await completarLogin(res);
        } catch (err) {
            setError(err?.message || 'Código incorrecto.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 flex flex-col">
            <header className="border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex justify-end">
                <ThemeToggle />
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
                {loginStep === 'credentials' ? (
                    <form
                        onSubmit={onSubmitCredentials}
                        className="w-full max-w-sm rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-lg space-y-4"
                    >
                        <div>
                            <p className="text-xs uppercase tracking-wider text-stone-500">Plataforma</p>
                            <h1 className="text-xl font-semibold">Master</h1>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                                Alta de restaurantes y enlaces de configuración.
                            </p>
                            <p className="text-xs text-stone-500 mt-2">
                                Recomendado: <code className="text-violet-600">http://master.localhost:5173/master/login</code>
                            </p>
                        </div>
                        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                        <label className="block text-sm">
                            <span className="text-stone-600 dark:text-stone-400">Correo</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="text-stone-600 dark:text-stone-400">Contraseña</span>
                            <PasswordInput
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-3 text-sm disabled:opacity-50"
                        >
                            {busy ? 'Entrando…' : 'Entrar'}
                        </button>
                    </form>
                ) : (
                    <form
                        onSubmit={onSubmitTwoFactor}
                        className="w-full max-w-sm rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-lg space-y-4"
                    >
                        <div>
                            <h1 className="text-xl font-semibold">Verificación en dos pasos</h1>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                                Ingresa el código de tu app de autenticación o un código de recuperación.
                            </p>
                        </div>
                        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                        <label className="block text-sm">
                            <span className="text-stone-600 dark:text-stone-400">Código TOTP</span>
                            <input
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="text-stone-600 dark:text-stone-400">O código de recuperación</span>
                            <input
                                value={recoveryCode}
                                onChange={(e) => setRecoveryCode(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-3 text-sm disabled:opacity-50"
                        >
                            {busy ? 'Verificando…' : 'Continuar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginStep('credentials');
                                setTwoFactorCode('');
                                setRecoveryCode('');
                                setError('');
                            }}
                            className="w-full text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                        >
                            ← Volver al login
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}
