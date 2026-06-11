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

function formatDateTime(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function statusLabel(status) {
    if (status === 'pending') return 'Pendiente';
    if (status === 'approved') return 'Aprobada';
    if (status === 'rejected') return 'Rechazada';
    return status;
}

function statusBadgeClass(status) {
    if (status === 'pending') {
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200';
    }
    if (status === 'approved') {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    }
    if (status === 'rejected') {
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
    }
    return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';
}

const STATUS_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'rejected', label: 'Rechazados' },
];

export function MasterBillingRenewalsPanel({ onMessage }) {
    const [loadingPending, setLoadingPending] = useState(true);
    const [pending, setPending] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    const [historyLoading, setHistoryLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [historyMeta, setHistoryMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
    const [historyError, setHistoryError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);

    const loadPending = useCallback(async () => {
        setLoadingPending(true);
        setError('');
        try {
            const res = await masterApiFetch('/api/master/billing/renewal-requests');
            setPending(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setError(err?.message || 'No se pudieron cargar las solicitudes pendientes.');
        } finally {
            setLoadingPending(false);
        }
    }, []);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const params = new URLSearchParams({
                page: String(page),
                per_page: '20',
                status: statusFilter,
            });
            if (search.trim()) {
                params.set('q', search.trim());
            }
            const res = await masterApiFetch(`/api/master/billing/renewal-history?${params.toString()}`);
            setHistory(Array.isArray(res?.data) ? res.data : []);
            setHistoryMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: 20 });
        } catch (err) {
            setHistoryError(err?.message || 'No se pudo cargar el historial de pagos.');
        } finally {
            setHistoryLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        void loadPending();
    }, [loadPending]);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    async function review(id, action) {
        setBusyId(id);
        setError('');
        try {
            const res = await masterApiFetch(`/api/master/billing/renewal-requests/${id}/${action}`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            onMessage?.(res?.message || 'Solicitud actualizada.');
            await Promise.all([loadPending(), loadHistory()]);
        } catch (err) {
            setError(err?.message || 'No se pudo procesar la solicitud.');
        } finally {
            setBusyId(null);
        }
    }

    function applySearch(e) {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
    }

    return (
        <div className="space-y-6">
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

                {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                {loadingPending ? (
                    <p className="mt-4 text-sm text-stone-500">Cargando pendientes…</p>
                ) : pending.length === 0 ? (
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
                                            <dd>{formatAccessDate(new Date(req.tenant_access_expires_at))}</dd>
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

            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-lg">Historial de pagos</h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            Trazabilidad de todas las notificaciones de pago enviadas por los restaurantes.
                        </p>
                    </div>
                    {!historyLoading && historyMeta.total > 0 ? (
                        <span className="text-xs text-stone-500">
                            {historyMeta.total} registro{historyMeta.total === 1 ? '' : 's'}
                        </span>
                    ) : null}
                </div>

                <div className="mt-4 flex flex-col lg:flex-row lg:items-end gap-3">
                    <form onSubmit={applySearch} className="flex flex-1 flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <label htmlFor="payment-history-search" className="sr-only">
                                Buscar restaurante o referencia
                            </label>
                            <input
                                id="payment-history-search"
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Buscar por restaurante, correo o referencia…"
                                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium shrink-0"
                        >
                            Buscar
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((filter) => {
                            const active = statusFilter === filter.value;
                            return (
                                <button
                                    key={filter.value}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(filter.value);
                                        setPage(1);
                                    }}
                                    className={
                                        active
                                            ? 'rounded-full bg-violet-600 text-white px-3 py-1.5 text-xs font-semibold'
                                            : 'rounded-full border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300'
                                    }
                                >
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {historyError ? (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{historyError}</p>
                ) : null}

                {historyLoading ? (
                    <p className="mt-4 text-sm text-stone-500">Cargando historial…</p>
                ) : history.length === 0 ? (
                    <p className="mt-4 text-sm text-stone-500">No hay pagos que coincidan con los filtros.</p>
                ) : (
                    <>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm min-w-[960px]">
                                <thead>
                                    <tr className="border-b border-stone-200 dark:border-stone-700 text-left text-stone-500">
                                        <th className="py-2 pr-3 font-medium">Fecha</th>
                                        <th className="py-2 pr-3 font-medium">Restaurante</th>
                                        <th className="py-2 pr-3 font-medium">Meses</th>
                                        <th className="py-2 pr-3 font-medium">Monto</th>
                                        <th className="py-2 pr-3 font-medium">Referencia</th>
                                        <th className="py-2 pr-3 font-medium">Estado</th>
                                        <th className="py-2 pr-3 font-medium">Revisión</th>
                                        <th className="py-2 font-medium">Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-stone-100 dark:border-stone-800 align-top"
                                        >
                                            <td className="py-3 pr-3 whitespace-nowrap text-stone-700 dark:text-stone-300">
                                                {formatDateTime(row.created_at)}
                                            </td>
                                            <td className="py-3 pr-3">
                                                <p className="font-medium">{row.tenant_name || row.tenant_slug}</p>
                                                <p className="text-xs text-stone-500">{row.tenant_slug}</p>
                                            </td>
                                            <td className="py-3 pr-3">{row.months}</td>
                                            <td className="py-3 pr-3 whitespace-nowrap">{formatCop(row.amount_cop)}</td>
                                            <td className="py-3 pr-3 font-mono text-xs break-all max-w-[140px]">
                                                {row.payment_reference}
                                            </td>
                                            <td className="py-3 pr-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
                                                >
                                                    {statusLabel(row.status)}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-3 text-xs text-stone-600 dark:text-stone-400">
                                                {row.reviewed_at ? (
                                                    <>
                                                        <p>{formatDateTime(row.reviewed_at)}</p>
                                                        {row.reviewed_by_name ? (
                                                            <p className="mt-0.5">por {row.reviewed_by_name}</p>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="py-3 text-xs text-stone-600 dark:text-stone-400 max-w-[220px]">
                                                {row.admin_note ? (
                                                    <p>
                                                        <span className="text-stone-500">Admin: </span>
                                                        {row.admin_note}
                                                    </p>
                                                ) : null}
                                                {row.master_note ? (
                                                    <p className={row.admin_note ? 'mt-1' : ''}>
                                                        <span className="text-stone-500">Master: </span>
                                                        {row.master_note}
                                                    </p>
                                                ) : null}
                                                {!row.admin_note && !row.master_note ? '—' : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {historyMeta.last_page > 1 ? (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-stone-500">
                                    Página {historyMeta.current_page} de {historyMeta.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={historyMeta.current_page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        disabled={historyMeta.current_page >= historyMeta.last_page}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm disabled:opacity-40"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </section>
        </div>
    );
}
