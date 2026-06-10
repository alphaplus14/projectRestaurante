import React, { useCallback, useEffect, useState } from 'react';
import { masterApiFetch } from '../auth/masterApiClient';

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

    return (
        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Verificación en dos pasos</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Protege el acceso Master con TOTP (Google Authenticator, Authy, etc.).
                </p>
            </div>

            {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

            {status.enabled ? (
                <p className="text-sm text-stone-700 dark:text-stone-300">
                    Activa para <strong>{status.email}</strong>.
                </p>
            ) : setup ? (
                <div className="space-y-3">
                    <div
                        className="inline-block rounded-xl border border-stone-200 dark:border-stone-700 bg-white p-3"
                        dangerouslySetInnerHTML={{ __html: setup.qr_svg }}
                    />
                    {setup.recovery_codes?.length ? (
                        <div className="text-xs text-stone-600 dark:text-stone-400">
                            <p className="font-semibold mb-1">Códigos de recuperación (guárdalos):</p>
                            <ul className="font-mono space-y-0.5">
                                {setup.recovery_codes.map((code) => (
                                    <li key={code}>{code}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    <form onSubmit={onConfirm} className="flex flex-wrap gap-2 items-end">
                        <label className="block text-sm flex-1 min-w-[10rem]">
                            <span className="text-stone-600 dark:text-stone-400">Código de 6 dígitos</span>
                            <input
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={confirmCode}
                                onChange={(e) => setConfirmCode(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold px-4 py-2 text-sm disabled:opacity-50"
                        >
                            Confirmar
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={busy}
                    onClick={onEnable}
                    className="rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold px-4 py-2 text-sm disabled:opacity-50"
                >
                    Activar 2FA
                </button>
            )}

            {status.enabled ? (
                <form onSubmit={onDisable} className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                    <label className="block text-sm">
                        <span className="text-stone-600 dark:text-stone-400">Contraseña para desactivar</span>
                        <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="mt-1 w-full max-w-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 text-sm disabled:opacity-50"
                    >
                        Desactivar 2FA
                    </button>
                </form>
            ) : null}
        </section>
    );
}
