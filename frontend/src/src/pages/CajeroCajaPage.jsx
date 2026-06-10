import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { logoutTenantSession } from '../auth/logoutSession';
import { ThemeToggle } from '../theme/ThemeToggle';
import { confirmStaffLogout } from '../utils/confirmLogout';
import { FacturaModal } from '../components/FacturaModal';

const METODOS_PAGO = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'DAVIPLATA', label: 'Daviplata' },
];

const BILLETES_COLOMBIA = [2000, 5000, 10000, 20000, 50000, 100000];

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

const FILTROS_RESERVAS = [
    { value: 'proximas', label: 'Próximas' },
    { value: 'hoy', label: 'Hoy' },
    { value: 'todas', label: 'Todas' },
];

function formatFechaHoraReserva(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function formatFranjaReserva(inicio, fin) {
    if (!inicio) return '—';
    const fmt = (iso) =>
        new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (!fin) return fmt(inicio);
    return `${fmt(inicio)} – ${fmt(fin)}`;
}

function etiquetaEstadoReserva(estado) {
    const map = {
        CONFIRMADA: 'Confirmada',
        SOLICITADA: 'Solicitada',
        CANCELADA: 'Cancelada',
        COMPLETADA: 'Completada',
        NO_ASISTIO: 'No asistió',
    };
    return map[estado] || estado;
}

function estadoReservaBadge(estado) {
    const e = String(estado || '').toUpperCase();
    if (e === 'CONFIRMADA' || e === 'SOLICITADA') {
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30';
    }
    if (e === 'CANCELADA') {
        return 'bg-red-500/15 text-red-800 dark:text-red-200 border-red-500/30';
    }
    return 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-600';
}

function formatMesaReserva(mesa) {
    if (!mesa) return 'Por asignar';
    if (mesa.nombre) return `Mesa ${mesa.numero} (${mesa.nombre})`;
    return `Mesa ${mesa.numero}`;
}

function ReservasModal({
    open,
    onClose,
    reservas,
    loading,
    error,
    filtro,
    onFiltroChange,
    onRefresh,
    nombre,
    onNombreChange,
    fecha,
    onFechaChange,
    hora,
    onHoraChange,
    onLimpiarBusqueda,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
                <div className="sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <img src="/admin navbar icons/reservas.png" alt="" className="h-6 w-6 object-contain dark:invert" />
                        <div>
                            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Reservas</h2>
                            <p className="text-xs text-stone-500">Para atender clientes en recepción</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {FILTROS_RESERVAS.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => onFiltroChange(f.value)}
                                    className={classNames(
                                        'rounded-lg border px-3 py-1.5 text-xs font-medium',
                                        filtro === f.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                                            : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400',
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                            {loading ? 'Actualizando…' : 'Actualizar'}
                        </button>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-3">
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="text-sm flex-1 min-w-[140px]">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Nombre o contacto</span>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => onNombreChange(e.target.value)}
                                    placeholder="Cliente, correo o teléfono…"
                                    className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Fecha</span>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => onFechaChange(e.target.value)}
                                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Hora</span>
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => onHoraChange(e.target.value)}
                                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={onLimpiarBusqueda}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-xs text-stone-600 dark:text-stone-400"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    ) : null}

                    {loading ? (
                        <p className="text-sm text-stone-500 py-10 text-center">Cargando reservas…</p>
                    ) : reservas.length === 0 ? (
                        <p className="text-sm text-stone-500 py-10 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                            No hay reservas en este filtro.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {reservas.map((r) => (
                                <li
                                    key={r.idReserva}
                                    className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-4 space-y-2"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="font-semibold text-stone-900 dark:text-stone-50">
                                                {r.reservado_por || r.cliente?.nombre_completo || 'Cliente'}
                                            </div>
                                            <div className="text-xs text-stone-500 mt-0.5">Reserva #{r.idReserva}</div>
                                        </div>
                                        <span
                                            className={classNames(
                                                'inline-flex text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border',
                                                estadoReservaBadge(r.estado),
                                            )}
                                        >
                                            {etiquetaEstadoReserva(r.estado)}
                                        </span>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-stone-500 text-xs block">Fecha y hora</span>
                                            <span className="text-stone-800 dark:text-stone-200">{formatFechaHoraReserva(r.fecha_hora)}</span>
                                        </div>
                                        <div>
                                            <span className="text-stone-500 text-xs block">Franja</span>
                                            <span className="text-stone-800 dark:text-stone-200">
                                                {formatFranjaReserva(r.fecha_hora, r.fecha_hora_fin)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-stone-500 text-xs block">Personas</span>
                                            <span className="font-medium tabular-nums">{r.num_personas}</span>
                                        </div>
                                        <div>
                                            <span className="text-stone-500 text-xs block">Mesa</span>
                                            <span>{formatMesaReserva(r.mesa)}</span>
                                        </div>
                                        {r.cliente?.telefono ? (
                                            <div>
                                                <span className="text-stone-500 text-xs block">Teléfono</span>
                                                <span className="tabular-nums">{r.cliente.telefono}</span>
                                            </div>
                                        ) : null}
                                        {r.cliente?.correo ? (
                                            <div>
                                                <span className="text-stone-500 text-xs block">Correo</span>
                                                <span className="break-all">{r.cliente.correo}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                    {r.notas ? (
                                        <p className="text-sm text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800 pt-2">
                                            <span className="text-xs text-stone-500 block mb-0.5">Notas</span>
                                            {r.notas}
                                        </p>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModalConfirmarLlamadaMesero({ open, onClose, onConfirm, busy }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 shadow-2xl p-5 sm:p-6"
            >
                <div className="flex gap-3">
                    <img
                        src="/admin navbar icons/mesero.png"
                        alt=""
                        className="h-10 w-10 shrink-0 object-contain dark:invert"
                    />
                    <div>
                        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">¿Llamar a un mesero?</h2>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                            Se avisará al salón de que necesitas ayuda en caja.
                        </p>
                    </div>
                </div>
                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white py-3 text-sm font-semibold disabled:opacity-50"
                    >
                        {busy ? 'Enviando…' : 'Llamar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CobrarModal({ open, cuenta, busy, onClose, onConfirm }) {
    const [impuesto, setImpuesto] = useState('0');
    const [conPropina, setConPropina] = useState(false);
    const [pagos, setPagos] = useState([emptyPago()]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setImpuesto('0');
        setConPropina(false);
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
    const listoParaCobro = cuenta.listo_para_cobro !== false;
    const puedeCobrar = listoParaCobro && total > 0 && sumPagos + 0.01 >= total;

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
        if (!listoParaCobro) {
            setError('Aún hay platos en cocina. Espera a que estén listos para cobrar.');
            return;
        }
        if (!puedeCobrar) {
            setError('El total recibido no puede ser menor al total a cobrar.');
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

                    {!listoParaCobro ? (
                        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
                            Aún hay platos en cocina. Podrás cobrar cuando todos estén listos.
                        </div>
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

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Subtotal</span>
                            <span className="font-medium tabular-nums">{formatMoney(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-stone-500 shrink-0">Propina</span>
                            <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConPropina(false);
                                        setImpuesto('0');
                                    }}
                                    className={classNames(
                                        'px-4 py-1.5 text-xs font-medium transition-colors',
                                        !conPropina
                                            ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                                            : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800',
                                    )}
                                >
                                    No
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConPropina(true)}
                                    className={classNames(
                                        'px-4 py-1.5 text-xs font-medium border-l border-stone-200 dark:border-stone-700 transition-colors',
                                        conPropina
                                            ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                                            : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800',
                                    )}
                                >
                                    Sí
                                </button>
                            </div>
                        </div>
                        {conPropina ? (
                            <div className="flex justify-between items-center gap-3 pt-1 border-t border-stone-200 dark:border-stone-800">
                                <label className="text-stone-500 shrink-0" htmlFor="impuesto-servicio">
                                    Monto propina / servicio
                                </label>
                                <input
                                    id="impuesto-servicio"
                                    type="number"
                                    min="0"
                                    step="100"
                                    autoFocus
                                    value={impuesto}
                                    onChange={(e) => setImpuesto(e.target.value)}
                                    className="w-32 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-right tabular-nums"
                                />
                            </div>
                        ) : null}
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

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 px-4 py-3 text-sm space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-stone-900 dark:text-stone-50">Total a cobrar</span>
                            <span className="text-lg font-bold text-blue-700 dark:text-blue-300 tabular-nums">{formatMoney(total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-stone-600 dark:text-stone-400">
                            <span>Total recibido</span>
                            <span className="tabular-nums">{formatMoney(sumPagos)}</span>
                        </div>
                        {exceso > 0 ? (
                            <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-800">
                                <span className="font-semibold text-amber-700 dark:text-amber-300">Devolución al cliente</span>
                                <span className="text-base font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                                    {formatMoney(exceso)}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <div
                        className={classNames(
                            'rounded-lg px-3 py-2 text-sm tabular-nums',
                            puedeCobrar
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50',
                        )}
                    >
                        {exceso > 0
                            ? `Recibes ${formatMoney(sumPagos)} y devuelves ${formatMoney(exceso)} de vuelto.`
                            : cuadra
                              ? 'Pagos cuadran con el total.'
                              : `Faltan ${formatMoney(restante)}`}
                    </div>

                    {error ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        disabled={busy || !puedeCobrar}
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
    const [cuentas, setCuentas] = useState([]);
    const [loadingPendientes, setLoadingPendientes] = useState(true);
    const [banner, setBanner] = useState('');
    const [cuentaActiva, setCuentaActiva] = useState(null);
    const [cobrando, setCobrando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalReservas, setModalReservas] = useState(false);
    const [reservas, setReservas] = useState([]);
    const [filtroReservas, setFiltroReservas] = useState('proximas');
    const [busquedaReservaNombre, setBusquedaReservaNombre] = useState('');
    const [busquedaReservaNombreDebounced, setBusquedaReservaNombreDebounced] = useState('');
    const [busquedaReservaFecha, setBusquedaReservaFecha] = useState('');
    const [busquedaReservaHora, setBusquedaReservaHora] = useState('');
    const [loadingReservas, setLoadingReservas] = useState(false);
    const [reservasError, setReservasError] = useState('');
    const [modalLlamarMesero, setModalLlamarMesero] = useState(false);
    const [llamandoMesero, setLlamandoMesero] = useState(false);
    const [facturaModal, setFacturaModal] = useState(false);
    const [facturaActiva, setFacturaActiva] = useState(null);

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

    const fetchReservas = useCallback(async () => {
        setLoadingReservas(true);
        setReservasError('');
        try {
            const params = new URLSearchParams({ filtro: filtroReservas });
            if (busquedaReservaNombreDebounced.trim()) {
                params.set('nombre', busquedaReservaNombreDebounced.trim());
            }
            if (busquedaReservaFecha) params.set('fecha', busquedaReservaFecha);
            if (busquedaReservaHora) params.set('hora', busquedaReservaHora);
            const res = await apiFetch(`/api/cajero/reservas?${params}`);
            setReservas(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            setReservas([]);
            setReservasError(e?.message || 'No se pudieron cargar las reservas.');
        } finally {
            setLoadingReservas(false);
        }
    }, [filtroReservas, busquedaReservaNombreDebounced, busquedaReservaFecha, busquedaReservaHora]);

    function limpiarBusquedaReservas() {
        setBusquedaReservaNombre('');
        setBusquedaReservaNombreDebounced('');
        setBusquedaReservaFecha('');
        setBusquedaReservaHora('');
    }

    useEffect(() => {
        const id = setTimeout(() => setBusquedaReservaNombreDebounced(busquedaReservaNombre), 400);
        return () => clearTimeout(id);
    }, [busquedaReservaNombre]);

    useEffect(() => {
        fetchPendientes();
        const id = setInterval(() => fetchPendientes({ silent: true }), 10000);
        return () => clearInterval(id);
    }, [fetchPendientes]);

    useEffect(() => {
        if (!modalReservas) return;
        void fetchReservas();
    }, [modalReservas, fetchReservas]);

    async function abrirReservas() {
        setModalReservas(true);
    }

    async function onLlamarMesero() {
        setLlamandoMesero(true);
        setBanner('');
        try {
            const res = await apiFetch('/api/cajero/llamar-mesero', { method: 'POST' });
            setModalLlamarMesero(false);
            setBanner(res?.message || 'Llamada enviada al mesero.');
        } catch (e) {
            setBanner(e?.message || 'No se pudo llamar al mesero.');
        } finally {
            setLlamandoMesero(false);
        }
    }

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
            if (res?.factura) {
                setFacturaActiva(res.factura);
                setFacturaModal(true);
            }
            await fetchPendientes({ silent: true });
        } catch (e) {
            setBanner(e?.message || 'No se pudo registrar el cobro.');
        } finally {
            setCobrando(false);
        }
    }

    async function onSalir() {
        await logoutTenantSession();
        window.location.href = '/staff?rol=cajero';
    }

    async function solicitarSalir() {
        const ok = await confirmStaffLogout();
        if (ok) await onSalir();
    }

    const pendientesOrdenadas = useMemo(
        () =>
            [...cuentas].sort(
                (a, b) =>
                    new Date(a.enviado_caja_en || a.actualizado_en) -
                    new Date(b.enviado_caja_en || b.actualizado_en),
            ),
        [cuentas],
    );

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-4xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Caja</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Cobro de cuentas pendientes</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void abrirReservas()}
                            aria-label="Ver reservas"
                            title="Reservas del local"
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <img
                                src="/admin navbar icons/reservas.png"
                                alt=""
                                className="h-5 w-5 object-contain dark:invert"
                            />
                        </button>
                        <button
                            type="button"
                            disabled={llamandoMesero}
                            onClick={() => setModalLlamarMesero(true)}
                            aria-label="Llamar un mesero"
                            title="Llamar un mesero"
                            className="rounded-xl border border-amber-500/50 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-950/30 p-2.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            <img
                                src="/admin navbar icons/mesero.png"
                                alt=""
                                className="h-5 w-5 object-contain dark:invert"
                            />
                        </button>
                        <ThemeToggle />
                        <Link
                            to="/cajero/facturas"
                            aria-label="Historial de facturas"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                        >
                            <img src="/admin navbar icons/ventas icono.png" alt="" className="h-4 w-4 shrink-0 object-contain dark:invert opacity-90" />
                            <span className="whitespace-nowrap">Facturas</span>
                        </Link>
                        <Link
                            to="/cajero/ajustes"
                            aria-label="Ajustes, ventas y mesas"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                        >
                            <img src="/ajustes.png" alt="" className="h-4 w-4 shrink-0 object-contain dark:invert opacity-90" />
                            <span className="whitespace-nowrap">Ajustes</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => void solicitarSalir()}
                            aria-label="Cerrar sesión"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-600/80 bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                        >
                            <img
                                src="/cerrar sesion icon.png"
                                alt=""
                                className="h-4 w-4 shrink-0 object-contain brightness-0 invert"
                                aria-hidden
                            />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-6">
                {banner ? (
                    <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
                        {banner}
                    </div>
                ) : null}

                {loadingPendientes ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 rounded-2xl bg-stone-200/60 dark:bg-stone-900 animate-pulse" />
                        ))}
                    </div>
                ) : pendientesOrdenadas.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center">
                        <p className="text-stone-600 dark:text-stone-400">No hay cuentas pendientes de cobro.</p>
                        <p className="mt-2 text-sm text-stone-500">Aparecerán cuando el mesero envíe la cuenta a caja.</p>
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
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-stone-900 dark:text-stone-50">
                                                    {formatMesa(c.mesa)}
                                                </span>
                                                <span
                                                    className={classNames(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                                        c.listo_para_cobro
                                                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                                                            : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
                                                    )}
                                                >
                                                    {c.listo_para_cobro ? 'Lista para cobrar' : 'En cocina'}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                                                Pedido #{c.idPedido}
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
                                            <div className="mt-1 text-xs text-stone-500">
                                                Enviada {formatTime(c.enviado_caja_en || c.actualizado_en)}
                                            </div>
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
            </main>

            <CobrarModal
                open={modalAbierto}
                cuenta={cuentaActiva}
                busy={cobrando}
                onClose={() => !cobrando && setModalAbierto(false)}
                onConfirm={confirmarCobro}
            />
            <ReservasModal
                open={modalReservas}
                onClose={() => setModalReservas(false)}
                reservas={reservas}
                loading={loadingReservas}
                error={reservasError}
                filtro={filtroReservas}
                onFiltroChange={setFiltroReservas}
                onRefresh={() => void fetchReservas()}
                nombre={busquedaReservaNombre}
                onNombreChange={setBusquedaReservaNombre}
                fecha={busquedaReservaFecha}
                onFechaChange={setBusquedaReservaFecha}
                hora={busquedaReservaHora}
                onHoraChange={setBusquedaReservaHora}
                onLimpiarBusqueda={limpiarBusquedaReservas}
            />
            <ModalConfirmarLlamadaMesero
                open={modalLlamarMesero}
                busy={llamandoMesero}
                onClose={() => !llamandoMesero && setModalLlamarMesero(false)}
                onConfirm={() => void onLlamarMesero()}
            />
            <FacturaModal
                open={facturaModal}
                factura={facturaActiva}
                onClose={() => setFacturaModal(false)}
            />
        </div>
    );
}
