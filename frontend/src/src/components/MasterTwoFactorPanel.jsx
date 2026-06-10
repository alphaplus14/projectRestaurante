import React, { useCallback, useEffect, useState } from 'react';
import { masterApiFetch } from '../auth/masterApiClient';
import { PasswordInput } from './PasswordInput';
import { TotpSixDigitInput } from './TotpSixDigitInput';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function RecoveryCodesBlock({ codes, title = 'Códigos de recuperación (guárdalos ahora)' }) {
    const [copied, setCopied] = useState(false);

    if (!codes?.length) {
        return null;
    }

    async function copyAll() {
        try {
            await navigator.clipboard.writeText(codes.join('\n'));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <div className="rounded-xl border border-amber-500/35 bg-amber-50 dark:bg-amber-950/25 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{title}</p>
                    <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
                        Cada código se usa una sola vez si pierdes acceso a la app. Guárdalos en un lugar seguro.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void copyAll()}
                    className="shrink-0 rounded-lg border border-amber-400/50 bg-white/80 dark:bg-stone-900/80 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-100/80 dark:hover:bg-amber-950/50"
                >
                    {copied ? 'Copiados' : 'Copiar todos'}
                </button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {codes.map((code) => (
                    <li
                        key={code}
                        className="rounded-lg border border-amber-200/80 dark:border-amber-800/60 bg-white dark:bg-stone-900 px-3 py-2 font-mono text-xs sm:text-sm text-amber-950 dark:text-amber-50 tracking-wide break-all"
                    >
                        {code}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function MasterTwoFactorPanel() {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState({ enabled: false, confirmed: false, email: '' });
    const [setup, setSetup] = useState(null);
    const [confirmCode, setConfirmCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadStatus = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await masterApiFetch('/api/master/two-factor/status');
            const data = res?.data ?? { enabled: false, confirmed: false, email: '' };
            setStatus(data);
            if (data.pending_setup && data.qr_svg) {
                setSetup({
                    qr_svg: data.qr_svg,
                    recovery_codes: data.recovery_codes ?? [],
                });
            }
        } catch (err) {
            setError(err?.message || 'No se pudo cargar el estado de 2FA.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    async function onEnable() {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await masterApiFetch('/api/master/two-factor/enable', { method: 'POST' });
            setSetup({
                qr_svg: res?.data?.qr_svg ?? '',
                recovery_codes: res?.data?.recovery_codes ?? [],
            });
            setMessage(res?.message || 'Escanea el código QR con tu app de autenticación.');
            await loadStatus();
        } catch (err) {
            setError(err?.message || 'No se pudo iniciar la configuración.');
        } finally {
            setBusy(false);
        }
    }

    async function onConfirm(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await masterApiFetch('/api/master/two-factor/confirm', {
                method: 'POST',
                body: JSON.stringify({ code: confirmCode.trim() }),
            });
            setConfirmCode('');
            setSetup(null);
            setMessage(res?.message || 'Verificación en dos pasos activada.');
            await loadStatus();
        } catch (err) {
            setError(err?.message || 'Código incorrecto.');
        } finally {
            setBusy(false);
        }
    }

    async function onDisable(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await masterApiFetch('/api/master/two-factor/disable', {
                method: 'DELETE',
                body: JSON.stringify({ password: disablePassword }),
            });
            setDisablePassword('');
            setSetup(null);
            setMessage(res?.message || '2FA desactivada.');
            await loadStatus();
        } catch (err) {
            setError(err?.message || 'No se pudo desactivar.');
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return <p className="text-sm text-stone-500">Cargando seguridad…</p>;
    }

    const pendingConfirm = setup?.qr_svg && !status.enabled;

    return (
        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Verificación en dos pasos</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Protege el acceso Master con TOTP (Google Authenticator, Authy, etc.).
                </p>
            </div>

            {message ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                    {message}
                </div>
            ) : null}
            {error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                    {error}
                </div>
            ) : null}

            {status.enabled ? (
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-800 dark:text-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Activa para <strong className="font-semibold">{status.email}</strong>
                    </div>

                    <form onSubmit={onDisable} className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
                        <p className="text-xs text-stone-600 dark:text-stone-500">
                            Para desactivar 2FA confirma tu contraseña actual.
                        </p>
                        <label className="block text-sm max-w-xs">
                            <span className="text-stone-600 dark:text-stone-400">Contraseña</span>
                            <PasswordInput
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                autoComplete="current-password"
                                minLength={5}
                                required
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                            <span className="mt-1 block text-xs text-stone-500">Mínimo 5 caracteres.</span>
                        </label>
                        <button
                            type="submit"
                            disabled={busy || disablePassword.length < 5}
                            className="rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 text-sm disabled:opacity-50"
                        >
                            Desactivar 2FA
                        </button>
                    </form>
                </div>
            ) : pendingConfirm ? (
                <div className="space-y-5">
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white p-3 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: setup.qr_svg }}
                        />
                        <p className="text-xs text-stone-500 text-center max-w-sm">
                            Escanea el QR con tu app de autenticación y luego confirma con el código de 6 dígitos.
                        </p>
                    </div>

                    <RecoveryCodesBlock codes={setup.recovery_codes} />

                    <form onSubmit={onConfirm} className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
                        <TotpSixDigitInput
                            value={confirmCode}
                            onChange={setConfirmCode}
                            disabled={busy}
                            accent="violet"
                            autoFocus
                            label="Confirma con tu app de autenticación"
                            hint="Abre Google Authenticator, Authy u otra app TOTP y escribe el código de 6 dígitos. También puedes pegarlo."
                        />
                        <button
                            type="submit"
                            disabled={busy || confirmCode.length < 6}
                            className={classNames(
                                'w-full sm:w-auto rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold px-6 py-3 text-sm',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'shadow-sm shadow-violet-900/10',
                            )}
                        >
                            {busy ? 'Verificando…' : 'Confirmar y activar 2FA'}
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onEnable()}
                    className="rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold px-4 py-2 text-sm disabled:opacity-50"
                >
                    Activar 2FA
                </button>
            )}
        </section>
    );
}
