import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { adminAlertError } from '../utils/adminAlerts';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function AdminTwoFactorPanel() {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState({ enabled: false, confirmed: false, correo: '' });
    const [setup, setSetup] = useState(null);
    const [confirmCode, setConfirmCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadStatus = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch('/api/admin/two-factor/status');
            const data = res?.data ?? { enabled: false, confirmed: false, correo: '' };
            setStatus(data);
            if (data.pending_setup && data.qr_svg) {
                setSetup({
                    qr_svg: data.qr_svg,
                    recovery_codes: data.recovery_codes ?? [],
                });
            }
        } catch (err) {
            void adminAlertError(err, 'Verificación en dos pasos');
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
            const res = await apiFetch('/api/admin/two-factor/enable', { method: 'POST' });
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
            const res = await apiFetch('/api/admin/two-factor/confirm', {
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

    async function onRegenerateCodes() {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await apiFetch('/api/admin/two-factor/recovery-codes', { method: 'POST' });
            setSetup((prev) => ({
                qr_svg: prev?.qr_svg ?? '',
                recovery_codes: res?.data?.recovery_codes ?? [],
            }));
            setMessage(res?.message || 'Nuevos códigos generados.');
        } catch (err) {
            setError(err?.message || 'No se pudieron generar códigos.');
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
            const res = await apiFetch('/api/admin/two-factor/disable', {
                method: 'DELETE',
                body: JSON.stringify({ password: disablePassword }),
            });
            setDisablePassword('');
            setSetup(null);
            setMessage(res?.message || 'Verificación desactivada.');
            await loadStatus();
        } catch (err) {
            setError(err?.message || 'No se pudo desactivar.');
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-sm text-stone-600 dark:text-stone-400">
                Cargando seguridad de la cuenta…
            </div>
        );
    }

    const pendingConfirm = setup?.qr_svg && !status.enabled;

    return (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
            <div>
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 border-b border-stone-200 dark:border-stone-800 pb-3">
                    Verificación en dos pasos (2FA)
                </h2>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    Protege el acceso de administrador con un código de 6 dígitos desde Google Authenticator, Authy u otra
                    app compatible. Al iniciar sesión se pedirá ese código después de la contraseña.
                </p>
                {status.correo ? (
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
                        Cuenta: <span className="font-medium text-stone-700 dark:text-stone-300">{status.correo}</span>
                    </p>
                ) : null}
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
                        Activa
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onRegenerateCodes()}
                            className="rounded-lg border border-stone-300 dark:border-stone-700 px-4 py-2 text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-60"
                        >
                            Generar nuevos códigos de recuperación
                        </button>
                    </div>

                    <form onSubmit={onDisable} className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                        <p className="text-xs text-stone-600 dark:text-stone-500">
                            Para desactivar 2FA confirma tu contraseña actual.
                        </p>
                        <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="Contraseña actual"
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                            autoComplete="current-password"
                        />
                        <button
                            type="submit"
                            disabled={busy || !disablePassword}
                            className="rounded-lg bg-red-700 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                        >
                            Desactivar verificación en dos pasos
                        </button>
                    </form>
                </div>
            ) : pendingConfirm ? (
                <div className="space-y-4">
                    <div
                        className="mx-auto max-w-[220px] rounded-xl border border-stone-200 dark:border-stone-700 bg-white p-3"
                        dangerouslySetInnerHTML={{ __html: setup.qr_svg }}
                    />
                    {setup.recovery_codes?.length ? (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                Códigos de recuperación (guárdalos ahora)
                            </p>
                            <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-amber-950 dark:text-amber-100">
                                {setup.recovery_codes.map((code) => (
                                    <li key={code}>{code}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    <form onSubmit={onConfirm} className="space-y-3">
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-200" htmlFor="2fa-confirm">
                            Código de 6 dígitos de la app
                        </label>
                        <input
                            id="2fa-confirm"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={confirmCode}
                            onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-lg tracking-widest text-center font-mono"
                            placeholder="000000"
                        />
                        <button
                            type="submit"
                            disabled={busy || confirmCode.length < 6}
                            className={classNames(
                                'w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
                                'bg-amber-600 hover:bg-amber-500 disabled:opacity-60',
                            )}
                        >
                            Confirmar y activar
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onEnable()}
                    className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                    Activar verificación en dos pasos
                </button>
            )}

            {status.enabled && setup?.recovery_codes?.length ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Códigos de recuperación nuevos</p>
                    <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-amber-950 dark:text-amber-100">
                        {setup.recovery_codes.map((code) => (
                            <li key={code}>{code}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
