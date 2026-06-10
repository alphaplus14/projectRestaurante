import React, { useState } from 'react';
import { PasswordInput } from '../components/PasswordInput';
import { TotpSixDigitInput } from '../components/TotpSixDigitInput';
import { useNavigate } from 'react-router-dom';
import { masterApiFetch } from '../auth/masterApiClient';
import { setMasterToken } from '../auth/masterAuthStorage';
import { clearSessionEndedState } from '../auth/sessionNavigation';
import { useSessionEndedNotice } from '../auth/useSessionEndedNotice';
import { ThemeToggle } from '../theme/ThemeToggle';

export function MasterLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [busy, setBusy] = useState(false);
    const [resendBusy, setResendBusy] = useState(false);
    const [loginStep, setLoginStep] = useState('credentials');
    const [challengeToken, setChallengeToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const sessionEndedNotice = useSessionEndedNotice();

    async function completarLogin(res) {
        setMasterToken(res.token);
        clearSessionEndedState();
        navigate('/master/dashboard', { replace: true });
    }

    const canSubmitCredentials = email.trim().length > 0 && password.length >= 5;

    async function onSubmitCredentials(e) {
        e.preventDefault();
        if (!canSubmitCredentials) {
            return;
        }
        setBusy(true);
        setError('');
        setInfo('');
        try {
            const res = await masterApiFetch('/api/master/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (res?.two_factor && res?.challenge_token) {
                setChallengeToken(res.challenge_token);
                setEmailSent(Boolean(res.email_sent));
                setInfo(
                    res.email_sent
                        ? `También enviamos el código a ${email.trim()}.`
                        : res?.message || 'Ingresa el código de tu app de autenticación.',
                );
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
            setTwoFactorCode('');
        } finally {
            setBusy(false);
        }
    }

    async function reenviarCorreo() {
        setResendBusy(true);
        setError('');
        try {
            const res = await masterApiFetch('/api/master/auth/two-factor-email', {
                method: 'POST',
                body: JSON.stringify({ challenge_token: challengeToken }),
            });
            setEmailSent(true);
            setInfo(res?.message || 'Código reenviado a tu correo.');
            setTwoFactorCode('');
        } catch (err) {
            setError(err?.message || 'No se pudo reenviar el correo.');
        } finally {
            setResendBusy(false);
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
                                Recomendado:{' '}
                                <code className="text-violet-600">http://master.localhost:5173/master/login</code>
                            </p>
                        </div>
                        {sessionEndedNotice ? (
                            <p className="text-sm rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-amber-900 dark:text-amber-100">
                                {sessionEndedNotice}
                            </p>
                        ) : null}
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
                                minLength={5}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                            <span className="mt-1 block text-xs text-stone-500">Mínimo 5 caracteres.</span>
                        </label>
                        <button
                            type="submit"
                            disabled={busy || !canSubmitCredentials}
                            className="w-full rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold py-3 text-sm disabled:opacity-50"
                        >
                            {busy ? 'Entrando…' : 'Entrar'}
                        </button>
                    </form>
                ) : (
                    <form
                        onSubmit={onSubmitTwoFactor}
                        className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-lg space-y-4"
                    >
                        <div>
                            <h1 className="text-xl font-semibold">Verificación en dos pasos</h1>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                                Usa tu app de autenticación o el código enviado a tu correo Master.
                            </p>
                        </div>

                        {info ? (
                            <div className="rounded-lg border border-violet-500/30 bg-violet-50 dark:bg-violet-950/30 px-3 py-2 text-sm text-violet-900 dark:text-violet-100">
                                {info}
                            </div>
                        ) : null}
                        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                        <TotpSixDigitInput
                            value={twoFactorCode}
                            onChange={setTwoFactorCode}
                            disabled={busy}
                            accent="violet"
                            autoFocus
                            label="Código de 6 dígitos"
                            hint="Mismo código que en tu app TOTP o en el correo recibido."
                        />

                        {emailSent || email ? (
                            <button
                                type="button"
                                disabled={resendBusy || busy}
                                onClick={() => void reenviarCorreo()}
                                className="text-sm text-violet-700 dark:text-violet-300 hover:underline disabled:opacity-50"
                            >
                                {resendBusy ? 'Reenviando…' : 'Reenviar código al correo'}
                            </button>
                        ) : null}

                        <label className="block text-sm">
                            <span className="text-stone-600 dark:text-stone-400">O código de recuperación</span>
                            <input
                                value={recoveryCode}
                                onChange={(e) => setRecoveryCode(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 font-mono text-sm"
                                placeholder="xxxx-xxxx"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={busy || (twoFactorCode.length < 6 && !recoveryCode.trim())}
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
                                setInfo('');
                                setEmailSent(false);
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
