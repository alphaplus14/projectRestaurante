import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { staffLoginUrl } from '../auth/staffLogin';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

const PAGE_SIZE = 8;

const FILTROS_HISTORIAL = [
    { value: 'todas', label: 'Todos' },
    { value: 'activos', label: 'Activos' },
    { value: 'cancelados', label: 'Pedidos cancelados' },
    { value: 'platos_cancelados', label: 'Platos cancelados' },
    { value: 'listos', label: 'Listos' },
    { value: 'entregados', label: 'Entregados' },
    { value: 'cerrados', label: 'Cerrados' },
];

const ESTADO_HISTORIAL_LABEL = {
    PENDIENTE: 'Nuevo',
    EN_PREPARACION: 'En preparación',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
};

const SEMAFORO = [
    {
        key: 'PENDIENTE',
        label: 'Nuevos',
        dotClass: 'bg-red-600 ring-red-600/40',
        activeTab: 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100',
    },
    {
        key: 'EN_PREPARACION',
        label: 'En preparación',
        dotClass: 'bg-yellow-500 ring-yellow-500/40',
        activeTab: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-100',
    },
    {
        key: 'LISTO',
        label: 'Listos',
        dotClass: 'bg-[#4d7c6f] ring-[#4d7c6f]/40',
        activeTab: 'border-[#4d7c6f] bg-[#4d7c6f]/10 text-stone-900 dark:text-stone-100',
    },
];

const SORT_OPTIONS = [
    { value: 'fecha_asc', label: 'Más antiguos primero' },
    { value: 'fecha_desc', label: 'Más recientes primero' },
    { value: 'tamano_desc', label: 'Pedido más grande' },
    { value: 'tamano_asc', label: 'Pedido más pequeño' },
];

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatMesa(mesa) {
    if (!mesa) return 'Sin mesa';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return `Mesa #${mesa.idMesa}`;
}

function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function pedidoTamano(pedido) {
    const activos = (pedido.detalles ?? []).filter((l) => l.estado_item !== 'CANCELADO');
    const lineas = activos.length;
    const unidades = activos.reduce((s, l) => s + Number(l.cantidad || 0), 0);
    const platosCancelados = (pedido.detalles ?? []).filter((l) => l.estado_item === 'CANCELADO').length;
    return { lineas, unidades, platosCancelados };
}

function sortPedidos(list, sortBy) {
    const copy = [...list];
    copy.sort((a, b) => {
        if (sortBy === 'fecha_asc') {
            return new Date(a.creado_en || 0) - new Date(b.creado_en || 0);
        }
        if (sortBy === 'fecha_desc') {
            return new Date(b.creado_en || 0) - new Date(a.creado_en || 0);
        }
        const ta = pedidoTamano(a).unidades;
        const tb = pedidoTamano(b).unidades;
        if (sortBy === 'tamano_desc') return tb - ta || b.idPedido - a.idPedido;
        if (sortBy === 'tamano_asc') return ta - tb || a.idPedido - b.idPedido;
        return 0;
    });
    return copy;
}

function PedidoResumenCard({ pedido, onAdvance, onVerDetalle, busyId }) {
    const busy = busyId === pedido.idPedido;
    const { lineas, unidades, platosCancelados } = pedidoTamano(pedido);
    const tieneNotasMesero = (pedido.detalles ?? []).some((l) => l.nota?.trim());
    const esCancelado = pedido.estado === 'CANCELADO';

    let action = null;
    if (!esCancelado && pedido.estado === 'PENDIENTE') {
        action = { label: 'Tomar pedido', next: 'EN_PREPARACION', className: 'bg-red-700 hover:bg-red-600' };
    } else if (!esCancelado && pedido.estado === 'EN_PREPARACION') {
        action = { label: 'Marcar listo', next: 'LISTO', className: 'bg-yellow-600 hover:bg-yellow-500 text-stone-950' };
    }

    return (
        <article
            className={classNames(
                'rounded-2xl border p-4 shadow-sm',
                esCancelado
                    ? 'border-red-500/60 dark:border-red-700/60 bg-red-50/50 dark:bg-red-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
            )}
            aria-label={`Pedido ${pedido.idPedido}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0 flex-1">
                    <div
                        className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-400/25 flex items-center justify-center shadow-sm"
                        aria-hidden
                    >
                        <img
                            src="/mesa cocineros icon.png"
                            alt=""
                            className="h-7 w-7 sm:h-8 sm:w-8 object-contain dark:invert"
                            draggable={false}
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Pedido
                        </div>
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-50 tabular-nums">
                            #{pedido.idPedido}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
                            {formatMesa(pedido.mesa)}
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                            {formatTime(pedido.creado_en)} · {lineas} línea{lineas !== 1 ? 's' : ''} · {unidades} u.
                            {platosCancelados > 0 ? (
                                <span className="text-red-700 dark:text-red-300 font-medium">
                                    {' '}
                                    · {platosCancelados} cancelado{platosCancelados !== 1 ? 's' : ''}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto sm:min-w-[140px]">
                    <button
                        type="button"
                        onClick={() => onVerDetalle(pedido)}
                        className={classNames(
                            'rounded-xl border px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-amber-500',
                            esCancelado
                                ? 'border-red-600 bg-red-600 text-white hover:bg-red-500 dark:border-red-500 dark:bg-red-700 dark:hover:bg-red-600'
                                : tieneNotasMesero
                                  ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-950 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800',
                        )}
                    >
                        Ver detalles
                        {esCancelado ? (
                            <img
                                src="/advertencia icon.png"
                                alt=""
                                className="inline-block ml-1.5 h-4 w-4 align-[-2px] dark:invert"
                                aria-hidden
                            />
                        ) : tieneNotasMesero ? (
                            <img
                                src="/advertencia.png"
                                alt=""
                                className="inline-block ml-1.5 h-4 w-4 align-[-2px] opacity-90"
                                aria-hidden
                            />
                        ) : null}
                    </button>
                    {esCancelado ? (
                        <span className="text-center text-xs font-semibold text-red-700 dark:text-red-300 py-2 px-1 line-clamp-2">
                            {pedido.motivo_cancelacion || 'Pedido cancelado por el mesero'}
                        </span>
                    ) : action ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onAdvance(pedido.idPedido, action.next)}
                            className={classNames(
                                'rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500',
                                action.className,
                            )}
                        >
                            {busy ? 'Guardando…' : action.label}
                        </button>
                    ) : (
                        <span className="text-center text-xs text-stone-500 dark:text-stone-400 py-2">
                            Esperando mesero
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}

function ListaDetallePlatos({ detalles, puedeCancelar, onCancelar, busyCancelId }) {
    const lineas = detalles ?? [];
    if (lineas.length === 0) {
        return <p className="text-sm text-stone-500 dark:text-stone-400 py-2">Sin platos en este pedido.</p>;
    }

    return (
        <ul className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
            {lineas.map((linea) => {
                const p = linea.producto;
                const tieneNota = Boolean(linea.nota?.trim());
                const esCancelado = linea.estado_item === 'CANCELADO';
                const busy = busyCancelId === linea.idPedidoDetalle;

                return (
                    <li
                        key={linea.idPedidoDetalle}
                        className={classNames(
                            'px-3 py-2 border-b border-stone-200 dark:border-stone-800 last:border-b-0',
                            esCancelado && 'bg-red-50/90 dark:bg-red-950/30',
                            !esCancelado && tieneNota && 'bg-amber-50/90 dark:bg-amber-950/30',
                        )}
                    >
                        <div className="flex items-start gap-2 min-w-0">
                            <span
                                className={classNames(
                                    'shrink-0 w-7 tabular-nums font-bold text-sm leading-snug',
                                    esCancelado
                                        ? 'text-red-700 dark:text-red-400 line-through'
                                        : 'text-amber-700 dark:text-amber-400',
                                )}
                            >
                                {linea.cantidad}×
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <span
                                        className={classNames(
                                            'font-medium text-sm leading-snug',
                                            esCancelado
                                                ? 'text-red-800 dark:text-red-200 line-through'
                                                : 'text-stone-900 dark:text-stone-50',
                                        )}
                                    >
                                        {p?.nombreProducto ?? 'Producto'}
                                    </span>
                                    {esCancelado ? (
                                        <span className="shrink-0 text-[10px] font-semibold uppercase text-red-800 dark:text-red-200">
                                            Cancelado
                                        </span>
                                    ) : tieneNota ? (
                                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-200">
                                            <img src="/advertencia.png" alt="" className="h-3 w-3" aria-hidden />
                                            Con detalle
                                        </span>
                                    ) : (
                                        <span className="shrink-0 text-[10px] text-stone-400 dark:text-stone-500">
                                            Sin detalle
                                        </span>
                                    )}
                                </div>
                                {tieneNota && !esCancelado ? (
                                    <p className="mt-0.5 text-xs text-amber-950 dark:text-amber-100 leading-snug">
                                        {linea.nota}
                                    </p>
                                ) : null}
                                {esCancelado ? (
                                    <p className="mt-1 text-xs text-red-900 dark:text-red-100 leading-snug">
                                        {linea.motivo_cancelacion || 'Sin motivo registrado.'}
                                        {linea.cancelado_por_nombre
                                            ? ` · ${linea.cancelado_por_nombre}`
                                            : ''}
                                        {linea.cancelado_en ? ` · ${formatTime(linea.cancelado_en)}` : ''}
                                    </p>
                                ) : null}
                                {puedeCancelar && !esCancelado ? (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => onCancelar(linea)}
                                        className="mt-2 rounded-lg border border-red-500/60 px-2.5 py-1 text-xs font-semibold text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-50"
                                    >
                                        {busy ? 'Cancelando…' : 'No se puede preparar'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function ModalCancelarPlato({ linea, pedido, onClose, onConfirm, busy, error }) {
    const [motivo, setMotivo] = useState('');
    if (!linea || !pedido) return null;

    const nombre = linea.producto?.nombreProducto ?? 'este plato';

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={busy ? undefined : onClose}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancelar-plato-titulo"
                className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-red-300 dark:border-red-800 bg-white dark:bg-stone-900 shadow-2xl p-5"
            >
                <h2 id="cancelar-plato-titulo" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                    Cancelar plato
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    Pedido #{pedido.idPedido} · {linea.cantidad}× {nombre}
                </p>
                <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                    El mesero verá el motivo en la cuenta. No se cobrará este ítem.
                </p>
                <label className="block mt-4 text-sm font-medium text-stone-800 dark:text-stone-200">
                    Motivo (obligatorio)
                    <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Ej.: sin stock, equipo averiado, ingrediente agotado…"
                        className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm resize-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    />
                </label>
                {error ? (
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                ) : null}
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-medium disabled:opacity-50"
                    >
                        Volver
                    </button>
                    <button
                        type="button"
                        disabled={busy || motivo.trim().length < 3}
                        onClick={() => onConfirm(motivo.trim())}
                        className="flex-1 rounded-xl bg-red-700 hover:bg-red-600 text-white py-3 text-sm font-semibold disabled:opacity-50"
                    >
                        {busy ? 'Guardando…' : 'Confirmar cancelación'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ModalHistorialCocina({
    abierto,
    onClose,
    filtro,
    onFiltroChange,
    conteos,
    pedidos,
    platosCancelados,
    loading,
    error,
    onVerDetalle,
    onRefresh,
}) {
    if (!abierto) return null;
    const esPlatosCancelados = filtro === 'platos_cancelados';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="historial-cocina-titulo"
                className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl"
            >
                <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex gap-3 min-w-0">
                        <img src="/ajustes.png" alt="" className="h-8 w-8 shrink-0 object-contain dark:invert" />
                        <div>
                            <h2 id="historial-cocina-titulo" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                                Historial de pedidos
                            </h2>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                Filtra y revisa el detalle completo de cada pedido.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm shrink-0"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex flex-wrap gap-2">
                        {FILTROS_HISTORIAL.map((f) => {
                            const activo = filtro === f.value;
                            const count = conteos?.[f.value];
                            const esCancelados =
                                f.value === 'cancelados' || f.value === 'platos_cancelados';
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => onFiltroChange(f.value)}
                                    className={classNames(
                                        'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                                        activo
                                            ? esCancelados
                                                ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100'
                                                : 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                                            : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800',
                                    )}
                                >
                                    {f.label}
                                    {count != null ? (
                                        <span className="ml-1 tabular-nums opacity-80">({count})</span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50"
                    >
                        {loading ? 'Cargando…' : 'Actualizar historial'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {error ? (
                        <p className="text-sm text-red-700 dark:text-red-300 rounded-lg border border-red-300/50 px-3 py-2">
                            {error}
                        </p>
                    ) : null}
                    {!loading && esPlatosCancelados && platosCancelados.length === 0 ? (
                        <p className="text-sm text-center text-stone-600 dark:text-stone-400 py-8">
                            No hay platos cancelados registrados.
                        </p>
                    ) : null}
                    {!loading && esPlatosCancelados
                        ? platosCancelados.map((it) => (
                              <div
                                  key={it.idPedidoDetalle}
                                  className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4"
                              >
                                  <div className="flex flex-wrap justify-between gap-2">
                                      <span className="font-bold text-stone-900 dark:text-stone-50">
                                          {it.cantidad}× {it.producto?.nombreProducto ?? 'Producto'}
                                      </span>
                                      <span className="text-xs text-stone-600 dark:text-stone-400">
                                          {formatTime(it.cancelado_en)}
                                      </span>
                                  </div>
                                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mt-1">
                                      Pedido #{it.idPedido} · {formatMesa(it.mesa)}
                                  </p>
                                  <p className="text-sm text-red-900 dark:text-red-100 mt-2 leading-snug">
                                      {it.motivo_cancelacion}
                                  </p>
                                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                                      {it.cancelado_por_nombre}
                                  </p>
                              </div>
                          ))
                        : null}
                    {!loading && !esPlatosCancelados && pedidos.length === 0 ? (
                        <p className="text-sm text-center text-stone-600 dark:text-stone-400 py-8">
                            No hay pedidos con este filtro.
                        </p>
                    ) : null}
                    {!esPlatosCancelados
                        ? pedidos.map((p) => {
                            const esCancelado = p.estado === 'CANCELADO';
                            const { lineas, unidades } = pedidoTamano(p);
                            return (
                                <button
                                    key={p.idPedido}
                                    type="button"
                                    onClick={() => onVerDetalle(p)}
                                    className={classNames(
                                        'w-full text-left rounded-xl border p-4 transition-colors',
                                        esCancelado
                                            ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-900',
                                    )}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <span className="font-bold text-stone-900 dark:text-stone-50">
                                            Pedido #{p.idPedido}
                                        </span>
                                        <span
                                            className={classNames(
                                                'text-[10px] uppercase font-semibold px-2 py-0.5 rounded',
                                                esCancelado
                                                    ? 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100'
                                                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
                                            )}
                                        >
                                            {ESTADO_HISTORIAL_LABEL[p.estado] ?? p.estado}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mt-1">
                                        {formatMesa(p.mesa)}
                                    </p>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                                        {formatTime(p.creado_en)} · {lineas} línea{lineas !== 1 ? 's' : ''} · {unidades} u.
                                        {p.mesero?.nombre ? ` · ${p.mesero.nombre}` : ''}
                                    </p>
                                    {esCancelado && p.motivo_cancelacion ? (
                                        <p className="text-sm text-red-800 dark:text-red-200 mt-2 line-clamp-2">
                                            {p.motivo_cancelacion}
                                        </p>
                                    ) : null}
                                </button>
                            );
                        })
                        : null}
                </div>
            </div>
        </div>
    );
}

function ModalDetallePedido({ pedido, onClose, puedeCancelarPlatos, onCancelarLinea, busyCancelId }) {
    if (!pedido) return null;

    const lineas = pedido.detalles ?? [];
    const conNotaMesero = lineas.filter((l) => l.nota?.trim()).length;
    const esCancelado = pedido.estado === 'CANCELADO';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalle-pedido-titulo"
                className="relative z-10 w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl"
            >
                <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-stone-200 dark:border-stone-800">
                    <div>
                        <h2 id="detalle-pedido-titulo" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                            Pedido #{pedido.idPedido}
                        </h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {formatMesa(pedido.mesa)} · {formatTime(pedido.creado_en)}
                        </p>
                        {pedido.mesero?.nombre ? (
                            <p className="text-xs text-stone-500 mt-1">Mesero: {pedido.mesero.nombre}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                    {esCancelado ? (
                        <div className="rounded-lg border border-red-500/60 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm">
                            <p className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-1.5">
                                <img src="/advertencia icon.png" alt="" className="h-4 w-4 dark:invert" />
                                Cancelado por el mesero
                            </p>
                            <p className="mt-1 text-red-950 dark:text-red-100 text-xs leading-snug">
                                {pedido.motivo_cancelacion || 'Sin motivo.'}
                                {pedido.cancelado_en ? ` · ${formatTime(pedido.cancelado_en)}` : ''}
                            </p>
                        </div>
                    ) : null}
                    {pedido.notas ? (
                        <p className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-xs text-amber-950 dark:text-amber-100">
                            <span className="font-semibold">Mesa:</span> {pedido.notas}
                        </p>
                    ) : null}
                    <p className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
                        {lineas.length} línea{lineas.length !== 1 ? 's' : ''}
                        {conNotaMesero > 0
                            ? ` · ${conNotaMesero} con detalle del mesero`
                            : ' · sin detalles del mesero'}
                    </p>
                    <ListaDetallePlatos
                        detalles={lineas}
                        puedeCancelar={puedeCancelarPlatos}
                        onCancelar={onCancelarLinea}
                        busyCancelId={busyCancelId}
                    />
                </div>
            </div>
        </div>
    );
}

function ModalConfirmarLlamadaMesero({ open, onClose, onConfirm, busy }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={busy ? undefined : onClose}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmar-llamada-titulo"
                className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 shadow-2xl p-5 sm:p-6"
            >
                <div className="flex gap-3">
                    <img src="/meserito.png" alt="" className="h-10 w-10 shrink-0 object-contain dark:invert" />
                    <div>
                        <h2 id="confirmar-llamada-titulo" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                            ¿Llamar a un mesero?
                        </h2>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                            Se avisará al salón de que necesitas ayuda en cocina.
                        </p>
                    </div>
                </div>
                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white py-3 text-sm font-semibold disabled:opacity-50"
                    >
                        {busy ? 'Enviando…' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CocinaPedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [tabActiva, setTabActiva] = useState('PENDIENTE');
    const [sortBy, setSortBy] = useState('fecha_asc');
    const [pagina, setPagina] = useState(1);
    const [detallePedido, setDetallePedido] = useState(null);
    const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
    const [filtroHistorial, setFiltroHistorial] = useState('todas');
    const [historialPedidos, setHistorialPedidos] = useState([]);
    const [historialPlatosCancelados, setHistorialPlatosCancelados] = useState([]);
    const [historialConteos, setHistorialConteos] = useState(null);
    const [historialLoading, setHistorialLoading] = useState(false);
    const [historialError, setHistorialError] = useState('');
    const [llamandoMesero, setLlamandoMesero] = useState(false);
    const [llamadaOk, setLlamadaOk] = useState('');
    const [modalConfirmarLlamada, setModalConfirmarLlamada] = useState(false);
    const [lineaCancelar, setLineaCancelar] = useState(null);
    const [busyCancelId, setBusyCancelId] = useState(null);
    const [cancelError, setCancelError] = useState('');

    const fetchPedidos = useCallback(async () => {
        try {
            const res = await apiFetch('/api/cocina/pedidos');
            setPedidos(Array.isArray(res?.data) ? res.data : []);
            setLoadError('');
        } catch (e) {
            setLoadError(e?.message || 'No se pudo cargar la cola de cocina.');
        }
    }, []);

    const fetchHistorial = useCallback(async (filtro) => {
        setHistorialLoading(true);
        setHistorialError('');
        try {
            const res = await apiFetch(`/api/cocina/pedidos/historial?filtro=${encodeURIComponent(filtro)}`);
            if (filtro === 'platos_cancelados') {
                setHistorialPedidos([]);
                setHistorialPlatosCancelados(Array.isArray(res?.data) ? res.data : []);
            } else {
                setHistorialPedidos(Array.isArray(res?.data) ? res.data : []);
                setHistorialPlatosCancelados([]);
            }
            setHistorialConteos(res?.conteos ?? null);
        } catch (e) {
            setHistorialError(e?.message || 'No se pudo cargar el historial.');
            setHistorialPedidos([]);
            setHistorialPlatosCancelados([]);
        } finally {
            setHistorialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPedidos();
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') fetchPedidos();
        }, 6000);
        return () => clearInterval(id);
    }, [fetchPedidos]);

    useEffect(() => {
        if (!modalHistorialAbierto) return;
        fetchHistorial(filtroHistorial);
    }, [modalHistorialAbierto, filtroHistorial, fetchHistorial]);

    const conteos = useMemo(() => {
        const c = { PENDIENTE: 0, EN_PREPARACION: 0, LISTO: 0 };
        for (const p of pedidos) {
            if (c[p.estado] != null) c[p.estado]++;
        }
        return c;
    }, [pedidos]);

    const pedidosTab = useMemo(() => {
        return sortPedidos(
            pedidos.filter((p) => p.estado === tabActiva),
            sortBy,
        );
    }, [pedidos, tabActiva, sortBy]);

    function abrirDetalle(pedido) {
        setDetallePedido(pedido);
    }

    function abrirHistorial() {
        setModalHistorialAbierto(true);
    }

    async function onLlamarMesero() {
        setLlamandoMesero(true);
        setLlamadaOk('');
        setLoadError('');
        try {
            const res = await apiFetch('/api/cocina/llamar-mesero', { method: 'POST' });
            setLlamadaOk(res?.message || 'Llamada enviada al mesero.');
            setModalConfirmarLlamada(false);
        } catch (e) {
            setLoadError(e?.message || 'No se pudo llamar al mesero.');
        } finally {
            setLlamandoMesero(false);
        }
    }

    const totalPaginas = Math.max(1, Math.ceil(pedidosTab.length / PAGE_SIZE));

    const pedidosPagina = useMemo(() => {
        const start = (pagina - 1) * PAGE_SIZE;
        return pedidosTab.slice(start, start + PAGE_SIZE);
    }, [pedidosTab, pagina]);

    useEffect(() => {
        setPagina(1);
    }, [tabActiva, sortBy]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    const puedeCancelarPlatos =
        detallePedido && !['CERRADO', 'CANCELADO'].includes(detallePedido.estado);

    function onSolicitarCancelarLinea(linea) {
        setCancelError('');
        setLineaCancelar(linea);
    }

    async function onConfirmarCancelarPlato(motivo) {
        if (!detallePedido || !lineaCancelar) return;
        const idPedido = detallePedido.idPedido;
        const idDetalle = lineaCancelar.idPedidoDetalle;
        setBusyCancelId(idDetalle);
        setCancelError('');
        try {
            const res = await apiFetch(
                `/api/cocina/pedidos/${idPedido}/detalles/${idDetalle}/cancelar`,
                { method: 'POST', body: JSON.stringify({ motivo }) },
            );
            const actualizado = res?.data;
            if (actualizado) {
                setDetallePedido(actualizado);
                setPedidos((prev) =>
                    prev.map((p) => (p.idPedido === actualizado.idPedido ? actualizado : p)),
                );
            }
            setLineaCancelar(null);
            await fetchPedidos();
            if (modalHistorialAbierto) {
                await fetchHistorial(filtroHistorial);
            }
        } catch (e) {
            setCancelError(e?.message || 'No se pudo cancelar el plato.');
        } finally {
            setBusyCancelId(null);
        }
    }

    async function onAdvance(idPedido, estado) {
        setBusyId(idPedido);
        try {
            await apiFetch(`/api/cocina/pedidos/${idPedido}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado }),
            });
            await fetchPedidos();
            if (estado === 'EN_PREPARACION') setTabActiva('EN_PREPARACION');
            if (estado === 'LISTO') setTabActiva('LISTO');
        } catch (e) {
            setLoadError(e?.message || 'No se pudo actualizar el pedido.');
        } finally {
            setBusyId(null);
        }
    }

    function onSalir() {
        clearToken();
        window.location.href = staffLoginUrl('COCINERO');
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                            Cocina
                        </h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Cola por estado · actualización cada 6 s</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={llamandoMesero}
                            onClick={() => setModalConfirmarLlamada(true)}
                            aria-label="Llamar un mesero"
                            title="Llamar un mesero"
                            className="rounded-xl border border-amber-500/50 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-950/30 p-2.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            <img src="/meserito.png" alt="" className="h-5 w-5 object-contain dark:invert" />
                        </button>
                        <button
                            type="button"
                            onClick={abrirHistorial}
                            aria-label="Historial y ajustes de pedidos"
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            <img src="/ajustes.png" alt="" className="h-5 w-5 object-contain dark:invert" />
                        </button>
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => fetchPedidos()}
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                            Actualizar
                        </button>
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm text-stone-600 dark:text-stone-400"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
                {loadError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                        {loadError}
                    </div>
                ) : null}

                {llamadaOk ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                        {llamadaOk}
                    </div>
                ) : null}

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {SEMAFORO.map((s) => {
                        const activo = tabActiva === s.key;
                        const count = conteos[s.key] ?? 0;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setTabActiva(s.key)}
                                className={classNames(
                                    'rounded-xl border-2 p-3 sm:p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation',
                                    activo
                                        ? s.activeTab
                                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600',
                                )}
                            >
                                <span
                                    className={classNames(
                                        'inline-block h-3 w-3 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 mb-2',
                                        s.dotClass,
                                    )}
                                    aria-hidden
                                />
                                <div className="text-xs sm:text-sm font-semibold leading-tight">{s.label}</div>
                                <div className="text-lg sm:text-2xl font-bold tabular-nums mt-1">{count}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                        <span className="font-medium text-stone-800 dark:text-stone-200">Ordenar</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <p className="text-sm text-stone-600 dark:text-stone-400 tabular-nums">
                        {pedidosTab.length} pedido{pedidosTab.length !== 1 ? 's' : ''}
                        {pedidosTab.length > PAGE_SIZE
                            ? ` · página ${pagina} de ${totalPaginas}`
                            : ''}
                    </p>
                </div>

                <div className="space-y-3 min-h-[120px]">
                    {pedidosPagina.length === 0 ? (
                        <p className="text-center text-sm text-stone-600 dark:text-stone-500 py-12 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                            No hay pedidos en esta columna.
                        </p>
                    ) : (
                        pedidosPagina.map((p) => (
                            <PedidoResumenCard
                                key={p.idPedido}
                                pedido={p}
                                onAdvance={onAdvance}
                                onVerDetalle={abrirDetalle}
                                busyId={busyId}
                            />
                        ))
                    )}
                </div>

                {pedidosTab.length > PAGE_SIZE ? (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            disabled={pagina <= 1}
                            onClick={() => setPagina((n) => Math.max(1, n - 1))}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Anterior
                        </button>
                        <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400">
                            {pagina} / {totalPaginas}
                        </span>
                        <button
                            type="button"
                            disabled={pagina >= totalPaginas}
                            onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Siguiente
                        </button>
                    </div>
                ) : null}

                <p className="text-center text-sm text-stone-600 dark:text-stone-500 pt-4">
                    <Link to="/cliente" className="hover:text-stone-800 dark:hover:text-stone-300">
                        Sitio para clientes
                    </Link>
                </p>
            </div>

            <ModalDetallePedido
                pedido={detallePedido}
                onClose={() => setDetallePedido(null)}
                puedeCancelarPlatos={puedeCancelarPlatos}
                onCancelarLinea={onSolicitarCancelarLinea}
                busyCancelId={busyCancelId}
            />
            <ModalCancelarPlato
                linea={lineaCancelar}
                pedido={detallePedido}
                busy={busyCancelId != null}
                error={cancelError}
                onClose={() => !busyCancelId && setLineaCancelar(null)}
                onConfirm={onConfirmarCancelarPlato}
            />
            <ModalConfirmarLlamadaMesero
                open={modalConfirmarLlamada}
                busy={llamandoMesero}
                onClose={() => !llamandoMesero && setModalConfirmarLlamada(false)}
                onConfirm={onLlamarMesero}
            />
            <ModalHistorialCocina
                abierto={modalHistorialAbierto}
                onClose={() => setModalHistorialAbierto(false)}
                filtro={filtroHistorial}
                onFiltroChange={setFiltroHistorial}
                conteos={historialConteos}
                pedidos={historialPedidos}
                platosCancelados={historialPlatosCancelados}
                loading={historialLoading}
                error={historialError}
                onVerDetalle={(p) => abrirDetalle(p)}
                onRefresh={() => fetchHistorial(filtroHistorial)}
            />
        </div>
    );
}
