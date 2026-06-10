import React, { useCallback, useEffect, useState } from 'react';
import { masterApiFetch } from '../auth/masterApiClient';
import { formatAccessDate } from '../utils/masterAccess';

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

function statusLabel(status) {
    if (status === 'pending') return 'Pendiente';
    if (status === 'approved') return 'Aprobada';
    if (status === 'rejected') return 'Rechazada';
    return status;
}

export function MasterBillingRenewalsPanel({ onMessage }) {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await masterApiFetch('/api/master/billing/renewal-requests');
            setRequests(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setError(err?.message || 'No se pudieron cargar las solicitudes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const pending = requests.filter((r) => r.status === 'pending');

    async function review(id, action) {
        setBusyId(id);
        setError('');
        try {
            const res = await masterApiFetch(`/api/master/billing/renewal-requests/${id}/${action}`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            onMessage?.(res?.message || 'Solicitud actualizada.');
            await load();
        } catch (err) {
            setError(err?.message || 'No se pudo procesar la solicitud.');
        } finally {
            setBusyId(null);
        }
    }

    if (loading) {
        return <p className="text-sm text-stone-500">Cargando pagos…</p>;
    }

    return (
        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-lg">Pagos Nequi pendientes</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                        El admin notifica el pago; tú confirmas y se extiende la licencia automáticamente.
                    </p>
                </div>
                {pending.length > 0 ? (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-3 py-1 text-xs font-semibold">
                        {pending.length} pendiente{pending.length === 1 ? '' : 's'}
                    </span>
                ) : null}
            </div>

            {error ? (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            {pending.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">No hay solicitudes pendientes de revisión.</p>
            ) : (
                <ul className="mt-4 space-y-4">
                    {pending.map((req) => (
                        <li
                            key={req.id}
                            className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium">
                                        {req.tenant_name || req.tenant_slug}{' '}
                                        <span className="text-stone-500 font-normal">({req.tenant_slug})</span>
                                    </p>
                                    <p className="text-xs text-stone-500 mt-0.5">{req.tenant_email}</p>
                                </div>
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                    {statusLabel(req.status)}
                                </span>
                            </div>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                    <dt className="text-stone-500">Meses</dt>
                                    <dd className="font-medium">{req.months}</dd>
                                </div>
                                <div>
                                    <dt className="text-stone-500">Monto</dt>
                                    <dd className="font-medium">{formatCop(req.amount_cop)}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-stone-500">Referencia Nequi</dt>
                                    <dd className="font-medium break-all">{req.payment_reference}</dd>
                                </div>
                                {req.tenant_access_expires_at ? (
                                    <div className="sm:col-span-2">
                                        <dt className="text-stone-500">Licencia actual vence</dt>
                                        <dd>{formatAccessDate(req.tenant_access_expires_at)}</dd>
                                    </div>
                                ) : null}
                                {req.admin_note ? (
                                    <div className="sm:col-span-2">
                                        <dt className="text-stone-500">Nota del admin</dt>
                                        <dd className="text-stone-700 dark:text-stone-300">{req.admin_note}</dd>
                                    </div>
                                ) : null}
                            </dl>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={busyId === req.id}
                                    onClick={() => void review(req.id, 'approve')}
                                    className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                                >
                                    Confirmar pago
                                </button>
                                <button
                                    type="button"
                                    disabled={busyId === req.id}
                                    onClick={() => void review(req.id, 'reject')}
                                    className="rounded-lg border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm disabled:opacity-50"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
