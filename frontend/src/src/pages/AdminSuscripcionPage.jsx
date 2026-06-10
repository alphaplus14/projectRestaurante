import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAlertError, adminAlertSuccess } from '../utils/adminAlerts';

const DEFAULT_MONTHS = [1, 3, 6, 12];

function formatCop(value) {
    if (value == null || Number.isNaN(Number(value))) {
        return '—';
    }
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function formatFecha(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'long' });
    } catch {
        return iso;
    }
}

export function AdminSuscripcionPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [months, setMonths] = useState(1);
    const [paymentReference, setPaymentReference] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const res = await apiFetch('/api/admin/suscripcion');
                if (!cancelled) {
                    setData(res?.data ?? null);
                    const opts = res?.data?.billing?.month_options;
                    if (Array.isArray(opts) && opts.length > 0) {
                        setMonths(opts[0]);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    void adminAlertError(err, 'Suscripción');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    const monthOptions = data?.billing?.month_options ?? DEFAULT_MONTHS;
    const packagePrices = data?.billing?.package_prices ?? {};
    const totalAmount = useMemo(() => {
        const value = packagePrices[months] ?? packagePrices[String(months)];
        if (value == null || Number.isNaN(Number(value))) {
            return null;
        }
        return Number(value);
    }, [packagePrices, months]);

    const pending = data?.pending_request;
    const billingConfigured = data?.billing?.configured;

    async function notificarPago(e) {
        e.preventDefault();
        const ref = paymentReference.trim();
        if (ref.length < 3) {
            void adminAlertError(new Error('Indica la referencia o número del pago Nequi.'), 'Renovación');
            return;
        }

        setBusy(true);
        try {
            const res = await apiFetch('/api/admin/suscripcion/renovacion', {
                method: 'POST',
                body: JSON.stringify({
                    months,
                    payment_reference: ref,
                    admin_note: adminNote.trim() || null,
                }),
            });
            void adminAlertSuccess('Renovación', res?.message || 'Solicitud enviada.');
            setPaymentReference('');
            setAdminNote('');
            const fresh = await apiFetch('/api/admin/suscripcion');
            setData(fresh?.data ?? null);
        } catch (err) {
            void adminAlertError(err, 'Renovación');
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <AdminLayout title="Renovar suscripción">
                <div className="flex items-center justify-center text-stone-600 dark:text-stone-400 py-20">
                    Cargando…
                </div>
            </AdminLayout>
        );
    }

    if (!data?.renewal_available) {
        return (
            <AdminLayout title="Renovar suscripción">
                <p className="text-sm text-stone-600 dark:text-stone-400">
                    La renovación en línea no está disponible en este entorno.
                </p>
            </AdminLayout>
        );
    }

    const license = data.license ?? {};

    return (
        <AdminLayout title="Renovar suscripción">
            <div className="max-w-2xl space-y-6">
                <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                    <h2 className="font-semibold text-lg">Estado de tu licencia</h2>
                    <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-stone-500">Vence</dt>
                            <dd className="font-medium">{formatFecha(license.access_expires_at)}</dd>
                        </div>
                        {typeof license.days_remaining === 'number' ? (
                            <div className="flex justify-between gap-4">
                                <dt className="text-stone-500">Días restantes</dt>
                                <dd className="font-medium">{license.days_remaining}</dd>
                            </div>
                        ) : null}
                        {license.scheduled_cancellation ? (
                            <p className="text-amber-700 dark:text-amber-300 pt-2">
                                Tu suscripción está programada para finalizar al vencer el periodo actual.
                            </p>
                        ) : null}
                    </dl>
                </section>

                {pending ? (
                    <section className="rounded-2xl border border-violet-500/30 bg-violet-50 dark:bg-violet-950/30 p-5">
                        <h2 className="font-semibold text-violet-900 dark:text-violet-100">
                            Solicitud en revisión
                        </h2>
                        <p className="text-sm text-violet-800 dark:text-violet-200 mt-2">
                            Enviaste una renovación de {pending.months} mes(es) por {formatCop(pending.amount_cop)}.
                            Referencia: <strong>{pending.payment_reference}</strong>. El proveedor la confirmará pronto.
                        </p>
                    </section>
                ) : null}

                <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-5">
                    <div>
                        <h2 className="font-semibold text-lg">Pagar con Nequi</h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            Realiza la transferencia y luego notifica el pago para que el proveedor extienda tu acceso.
                        </p>
                    </div>

                    {!billingConfigured ? (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            El proveedor aún no configuró los datos de pago Nequi. Contacta soporte para renovar.
                        </p>
                    ) : (
                        <>
                            {data.billing?.nequi_qr_url ? (
                                <div className="flex flex-col items-center gap-2">
                                    <img
                                        src={data.billing.nequi_qr_url}
                                        alt="Código QR Nequi"
                                        className="max-w-[220px] rounded-xl border border-stone-200 dark:border-stone-700"
                                    />
                                    <p className="text-xs text-stone-500">Escanea para pagar</p>
                                </div>
                            ) : null}

                            {data.billing?.nequi_key ? (
                                <p className="text-sm">
                                    <span className="text-stone-500">Llave / número Nequi: </span>
                                    <span className="font-mono font-semibold">{data.billing.nequi_key}</span>
                                </p>
                            ) : null}

                            {!pending ? (
                                <form onSubmit={notificarPago} className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                                    <div>
                                        <p className="text-sm font-medium mb-2">Meses a renovar</p>
                                        <p className="text-xs text-stone-500 mb-3">
                                            Cada paquete tiene un precio fijo configurado por el proveedor.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {monthOptions.map((m) => {
                                                const selected = months === m;
                                                const total =
                                                    packagePrices[m] ?? packagePrices[String(m)] ?? null;
                                                return (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setMonths(m)}
                                                        className={
                                                            selected
                                                                ? 'rounded-xl border-2 border-violet-600 bg-violet-50 dark:bg-violet-950/40 px-3 py-3 text-left transition-colors'
                                                                : 'rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-3 text-left hover:border-violet-400/60 transition-colors'
                                                        }
                                                    >
                                                        <span className="block text-sm font-semibold">
                                                            {m} mes{m === 1 ? '' : 'es'}
                                                        </span>
                                                        {total != null ? (
                                                            <span
                                                                className={
                                                                    selected
                                                                        ? 'block text-sm text-violet-700 dark:text-violet-300 mt-1 font-medium'
                                                                        : 'block text-sm text-stone-600 dark:text-stone-400 mt-1'
                                                                }
                                                            >
                                                                {formatCop(total)}
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {totalAmount != null ? (
                                        <div className="rounded-xl border border-violet-500/30 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-sm text-violet-900 dark:text-violet-100">
                                                Total a pagar ({months} mes{months === 1 ? '' : 'es'})
                                            </span>
                                            <strong className="text-lg text-violet-800 dark:text-violet-200">
                                                {formatCop(totalAmount)}
                                            </strong>
                                        </div>
                                    ) : null}

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" htmlFor="renew-ref">
                                            Referencia del pago Nequi
                                        </label>
                                        <input
                                            id="renew-ref"
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="Ej. M12345678 o número de aprobación"
                                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-2 text-sm"
                                            maxLength={120}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" htmlFor="renew-note">
                                            Nota opcional
                                        </label>
                                        <textarea
                                            id="renew-note"
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-2 text-sm"
                                            placeholder="Horario del pago, nombre del titular, etc."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-medium"
                                    >
                                        {busy ? 'Enviando…' : 'Notificar pago'}
                                    </button>
                                </form>
                            ) : null}
                        </>
                    )}
                </section>

                <p className="text-xs text-stone-500">
                    <Link to="/admin/dashboard" className="text-violet-600 dark:text-violet-400 hover:underline">
                        Volver al dashboard
                    </Link>
                </p>
            </div>
        </AdminLayout>
    );
}
