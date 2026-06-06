import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

const METODOS_PAGO = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'DAVIPLATA', label: 'Daviplata' },
];

const BILLETES_COLOMBIA = [2000, 5000, 10000, 20000, 50000, 100000];

const ESTADO_LABEL = {
    LISTO: 'Listo en cocina',
    ENTREGADO: 'Entregado al salón',
};

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatMoney(n) {
    const v = Number(n || 0);
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(v);
}

function formatMesa(mesa) {
    if (!mesa) return 'Sin mesa';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return `Mesa #${mesa.idMesa}`;
}

function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function emptyPago() {
    return { metodo: 'EFECTIVO', valor: '', referencia: '' };
}

function CobrarModal({ open, cuenta, busy, onClose, onConfirm }) {
    const [impuesto, setImpuesto] = useState('0');
    const [pagos, setPagos] = useState([emptyPago()]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setImpuesto('0');
        setPagos([emptyPago()]);
        setError('');
    }, [open, cuenta?.idPedido]);

    if (!open || !cuenta) return null;

    const subtotal = Number(cuenta.subtotal || 0);
    const impuestoNum = Math.max(0, Number(impuesto) || 0);
    const total = subtotal + impuestoNum;
    const sumPagos = pagos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
    const restante = Math.max(0, total - sumPagos);
    const exceso = Math.max(0, sumPagos - total);
    const cuadra = Math.abs(sumPagos - total) < 0.01 && total > 0;

    function updatePago(idx, field, value) {
        setPagos((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
    }

    function addPago() {
        setPagos((prev) => [...prev, emptyPago()]);
    }

    function removePago(idx) {
        setPagos((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    }

    function pagarTodo(idx) {
        const otros = pagos.reduce((s, p, i) => (i === idx ? s : s + (Number(p.valor) || 0)), 0);
        const falta = Math.max(0, total - otros);
        updatePago(idx, 'valor', String(Math.round(falta)));
    }

    function sumarBillete(idx, monto) {
        const actual = Number(pagos[idx]?.valor) || 0;
        updatePago(idx, 'valor', String(Math.round(actual + monto)));
    }

    function handleConfirm() {
        setError('');
        const payloadPagos = pagos
            .map((p) => ({
                metodo: p.metodo,
                valor: Number(p.valor),
                referencia: String(p.referencia || '').trim() || null,
            }))
            .filter((p) => p.valor > 0);

        if (payloadPagos.length === 0) {
            setError('Agrega al menos un pago.');
            return;
        }
        if (!cuadra) {
            setError('La suma de pagos debe coincidir con el total.');
            return;
        }
        onConfirm({
            impuesto_o_servicio: impuestoNum,
            pagos: payloadPagos,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
                <div className="sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur px-5 py-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Cobrar cuenta</h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {formatMesa(cuenta.mesa)} · Pedido #{cuenta.idPedido}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {cuenta.mesero ? (
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            Mesero: {cuenta.mesero.nombre} {cuenta.mesero.apellido}
                        </p>
                    ) : null}

                    <ul className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-200 dark:divide-stone-800 text-sm max-h-48 overflow-y-auto">
                        {(cuenta.detalles ?? []).map((d) => (
                            <li key={d.idPedidoDetalle} className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-stone-800 dark:text-stone-200">
                                    {d.producto?.nombreProducto ?? 'Ítem'} ×{d.cantidad}
                                </span>
                                <span className="tabular-nums text-stone-600 dark:text-stone-400">
                                    {formatMoney(Number(d.precio_unitario) * Number(d.cantidad))}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Subtotal</span>
                            <span className="font-medium tabular-nums">{formatMoney(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                            <label className="text-stone-500 shrink-0" htmlFor="impuesto-servicio">
                                Propina / servicio
                            </label>
                            <input
                                id="impuesto-servicio"
                                type="number"
                                min="0"
                                step="100"
                                value={impuesto}
                                onChange={(e) => setImpuesto(e.target.value)}
                                className="w-32 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-right tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Pagos</h3>
                            <button
                                type="button"
                                onClick={addPago}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                + Otro método
                            </button>
                        </div>
                        {pagos.map((p, idx) => (
                            <div key={idx} className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 space-y-2">
                                <div className="flex gap-2">
                                    <select
                                        value={p.metodo}
                                        onChange={(e) => updatePago(idx, 'metodo', e.target.value)}
                                        className="flex-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-2 text-sm"
                                    >
                                        {METODOS_PAGO.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        placeholder="Valor"
                                        value={p.valor}
                                        onChange={(e) => updatePago(idx, 'valor', e.target.value)}
                                        className="w-28 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-2 text-sm text-right tabular-nums"
                                    />
                                    {pagos.length > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => removePago(idx)}
                                            className="text-stone-500 hover:text-red-600 px-2"
                                            aria-label="Quitar pago"
                                        >
                                            ×
                                        </button>
                                    ) : null}
                                </div>
                                {p.metodo === 'EFECTIVO' ? (
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-stone-500 dark:text-stone-400">Billetes</p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {BILLETES_COLOMBIA.map((billete) => (
                                                <button
                                                    key={billete}
                                                    type="button"
                                                    onClick={() => sumarBillete(idx, billete)}
                                                    className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 tabular-nums"
                                                >
                                                    +{formatMoney(billete)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        placeholder="Referencia (opcional)"
                                        value={p.referencia}
                                        onChange={(e) => updatePago(idx, 'referencia', e.target.value)}
                                        className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-2 text-sm"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => pagarTodo(idx)}
                                    className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                                >
                                    Pagar saldo restante aquí
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 px-4 py-3 text-sm">
                        <span className="font-semibold text-stone-900 dark:text-stone-50">Total a cobrar</span>
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-300 tabular-nums">{formatMoney(total)}</span>
                    </div>

                    <div
                        className={classNames(
                            'rounded-lg px-3 py-2 text-sm tabular-nums',
                            cuadra
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50',
                        )}
                    >
                        {cuadra
                            ? 'Pagos cuadran con el total.'
                            : exceso > 0
                              ? `Exceso de ${formatMoney(exceso)}`
                              : `Faltan ${formatMoney(restante)}`}
                    </div>

                    {error ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        disabled={busy || !cuadra}
                        onClick={handleConfirm}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 text-sm disabled:opacity-50"
                    >
                        {busy ? 'Registrando cobro…' : 'Confirmar cobro y liberar mesa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CajeroCajaPage() {
    const [tab, setTab] = useState('pendientes');
    const [cuentas, setCuentas] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [resumenVentas, setResumenVentas] = useState({ total_dia: 0, num_ventas: 0 });
    const [loadingPendientes, setLoadingPendientes] = useState(true);
    const [loadingVentas, setLoadingVentas] = useState(false);
    const [banner, setBanner] = useState('');
    const [cuentaActiva, setCuentaActiva] = useState(null);
    const [cobrando, setCobrando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);

    const fetchPendientes = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoadingPendientes(true);
        try {
            const res = await apiFetch('/api/cajero/cuentas-pendientes');
            setCuentas(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            if (!silent) setBanner(e?.message || 'No se pudieron cargar las cuentas.');
        } finally {
            if (!silent) setLoadingPendientes(false);
        }
    }, []);

    const fetchVentas = useCallback(async () => {
        setLoadingVentas(true);
        try {
            const res = await apiFetch('/api/cajero/ventas-hoy');
            setVentas(Array.isArray(res?.data) ? res.data : []);
            setResumenVentas({
                total_dia: res?.total_dia ?? 0,
                num_ventas: res?.num_ventas ?? 0,
            });
        } catch (e) {
            setBanner(e?.message || 'No se pudieron cargar las ventas.');
        } finally {
            setLoadingVentas(false);
        }
    }, []);

    useEffect(() => {
        fetchPendientes();
        const id = setInterval(() => fetchPendientes({ silent: true }), 10000);
        return () => clearInterval(id);
    }, [fetchPendientes]);

    useEffect(() => {
        if (tab === 'ventas') fetchVentas();
    }, [tab, fetchVentas]);

    async function abrirCobro(cuentaResumen) {
        setBanner('');
        try {
            const res = await apiFetch(`/api/cajero/pedidos/${cuentaResumen.idPedido}`);
            setCuentaActiva(res?.data ?? null);
            setModalAbierto(true);
        } catch (e) {
            setBanner(e?.message || 'No se pudo cargar la cuenta.');
            await fetchPendientes({ silent: true });
        }
    }

    async function confirmarCobro(payload) {
        if (!cuentaActiva?.idPedido) return;
        setCobrando(true);
        setBanner('');
        try {
            const res = await apiFetch(`/api/cajero/pedidos/${cuentaActiva.idPedido}/cobrar`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setModalAbierto(false);
            setCuentaActiva(null);
            setBanner(res?.message || 'Cuenta cobrada.');
            await fetchPendientes({ silent: true });
            if (tab === 'ventas') await fetchVentas();
        } catch (e) {
            setBanner(e?.message || 'No se pudo registrar el cobro.');
        } finally {
            setCobrando(false);
        }
    }

    function onSalir() {
        clearToken();
        window.location.href = '/staff?rol=cajero';
    }

    const pendientesOrdenadas = useMemo(
        () => [...cuentas].sort((a, b) => new Date(a.actualizado_en) - new Date(b.actualizado_en)),
        [cuentas],
    );

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-4xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Caja</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Cobro de cuentas y ventas del día</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-lg border border-stone-200 dark:border-stone-800 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                        >
                            Salir
                        </button>
                    </div>
                </div>
                <div className="mx-auto max-w-4xl px-4 pb-3 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setTab('pendientes')}
                        className={classNames(
                            'rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
                            tab === 'pendientes'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60',
                        )}
                    >
                        Pendientes
                        {cuentas.length > 0 ? (
                            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1 text-xs">
                                {cuentas.length}
                            </span>
                        ) : null}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('ventas')}
                        className={classNames(
                            'rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
                            tab === 'ventas'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60',
                        )}
                    >
                        Mis ventas hoy
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-6">
                {banner ? (
                    <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
                        {banner}
                    </div>
                ) : null}

                {tab === 'pendientes' ? (
                    <>
                        {loadingPendientes ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 rounded-2xl bg-stone-200/60 dark:bg-stone-900 animate-pulse" />
                                ))}
                            </div>
                        ) : pendientesOrdenadas.length === 0 ? (
                            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center">
                                <p className="text-stone-600 dark:text-stone-400">No hay cuentas pendientes de cobro.</p>
                                <p className="mt-2 text-sm text-stone-500">Aparecerán cuando cocina termine y el mesero retire el pedido.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {pendientesOrdenadas.map((c) => (
                                    <li key={c.idPedido}>
                                        <button
                                            type="button"
                                            onClick={() => abrirCobro(c)}
                                            className="w-full text-left rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-blue-400/50 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="font-semibold text-stone-900 dark:text-stone-50">
                                                        {formatMesa(c.mesa)}
                                                    </div>
                                                    <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                                                        Pedido #{c.idPedido} · {ESTADO_LABEL[c.estado] || c.estado}
                                                    </div>
                                                    {c.mesero ? (
                                                        <div className="mt-0.5 text-xs text-stone-500">
                                                            {c.mesero.nombre} {c.mesero.apellido}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                                                        {formatMoney(c.subtotal)}
                                                    </div>
                                                    <div className="mt-1 text-xs text-stone-500">{formatTime(c.actualizado_en)}</div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-stone-500">
                                                {c.num_lineas} {c.num_lineas === 1 ? 'línea' : 'líneas'} · {c.total_unidades}{' '}
                                                {c.total_unidades === 1 ? 'unidad' : 'unidades'}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-wrap gap-6">
                            <div>
                                <div className="text-xs text-stone-500 uppercase tracking-wide">Ventas hoy</div>
                                <div className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                                    {formatMoney(resumenVentas.total_dia)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-stone-500 uppercase tracking-wide">Transacciones</div>
                                <div className="text-2xl font-bold tabular-nums">{resumenVentas.num_ventas}</div>
                            </div>
                        </div>

                        {loadingVentas ? (
                            <p className="text-center text-stone-500 py-12">Cargando ventas…</p>
                        ) : ventas.length === 0 ? (
                            <p className="text-center text-stone-500 py-12">Aún no has registrado ventas hoy.</p>
                        ) : (
                            <ul className="space-y-3">
                                {ventas.map((v) => (
                                    <li
                                        key={v.idVenta}
                                        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
                                    >
                                        <div className="flex justify-between gap-3">
                                            <div>
                                                <div className="font-medium">
                                                    {formatMesa(v.pedido?.mesa)} · #{v.pedido?.idPedido}
                                                </div>
                                                <div className="mt-1 text-xs text-stone-500">{formatTime(v.registrada_en)}</div>
                                            </div>
                                            <div className="font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                                                {formatMoney(v.total)}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(v.pagos ?? []).map((p) => (
                                                <span
                                                    key={p.idPago}
                                                    className="inline-flex rounded-full border border-stone-200 dark:border-stone-700 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-400"
                                                >
                                                    {p.metodo}: {formatMoney(p.valor)}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </main>

            <CobrarModal
                open={modalAbierto}
                cuenta={cuentaActiva}
                busy={cobrando}
                onClose={() => !cobrando && setModalAbierto(false)}
                onConfirm={confirmarCobro}
            />
        </div>
    );
}
