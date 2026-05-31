import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

const PASOS = [
    { id: 1, label: 'Información' },
    { id: 2, label: 'Horario' },
    { id: 3, label: 'Personas' },
    { id: 4, label: 'Fecha' },
    { id: 5, label: 'Resultado' },
];

const SLOT_MINUTES = 90;
const MAX_DIAS = 10;
const MAX_PERSONAS = 20;

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function dateToInputValue(d) {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 10);
}

function minDateLocal() {
    return dateToInputValue(new Date());
}

function maxDateLocal() {
    const d = new Date();
    d.setDate(d.getDate() + MAX_DIAS);
    return dateToInputValue(d);
}

/** Franjas de 1 h 30 min entre 10:00 y 20:30 (última inicio 19:00). */
function buildTimeSlots() {
    const slots = [];
    let cursor = 10 * 60;
    const lastEnd = 20 * 60 + 30;

    while (cursor + SLOT_MINUTES <= lastEnd) {
        const h = Math.floor(cursor / 60);
        const m = cursor % 60;
        const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const end = cursor + SLOT_MINUTES;
        const eh = Math.floor(end / 60);
        const em = end % 60;
        slots.push({
            value,
            endValue: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
        });
        cursor += SLOT_MINUTES;
    }
    return slots;
}

const TIME_SLOTS = buildTimeSlots();

function formatHora12(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatSlotLabel(slot) {
    return `${formatHora12(slot.value)} – ${formatHora12(slot.endValue)}`;
}

function formatFechaHora(iso) {
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

function formatFechaLarga(yyyyMmDd) {
    if (!yyyyMmDd) return '—';
    const [y, mo, d] = yyyyMmDd.split('-').map(Number);
    const dt = new Date(y, mo - 1, d);
    return dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function estadoStyle(estado) {
    const e = String(estado || '').toUpperCase();
    if (e === 'CONFIRMADA' || e === 'SOLICITADA') {
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30';
    }
    if (e === 'CANCELADA' || e === 'RECHAZADA' || e === 'NO_ASISTIO') {
        return 'bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-neutral-300 border-stone-300 dark:border-white/15';
    }
    return 'bg-stone-100 text-stone-800 dark:bg-white/10 dark:text-neutral-200 border-stone-200 dark:border-white/10';
}

function etiquetaEstadoReserva(estado) {
    const e = String(estado || '').toUpperCase();
    if (e === 'CONFIRMADA' || e === 'SOLICITADA') return 'Reservada';
    if (e === 'COMPLETADA') return 'Completada';
    if (e === 'CANCELADA') return 'Cancelada';
    if (e === 'NO_ASISTIO') return 'No asistió';
    return estado;
}

function franjaDesdeReserva(reserva) {
    if (!reserva?.fecha_hora) return null;
    const inicio = new Date(reserva.fecha_hora);
    const fin = new Date(inicio.getTime() + SLOT_MINUTES * 60 * 1000);
    const fmt = (d) =>
        d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${fmt(inicio)} – ${fmt(fin)}`;
}

function filaResumen(label, value, pendiente) {
    return (
        <div className="flex justify-between gap-3 py-2.5 border-b border-stone-200/80 dark:border-white/10 last:border-0">
            <span className="text-xs font-medium text-stone-500 dark:text-neutral-500 shrink-0">{label}</span>
            <span
                className={classNames(
                    'text-sm text-right font-medium min-w-0 break-words',
                    pendiente ? 'text-stone-400 dark:text-neutral-500 italic' : 'text-stone-900 dark:text-neutral-100',
                )}
            >
                {value}
            </span>
        </div>
    );
}

function CancelarReservaModal({ open, onClose, onConfirm, busy }) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setMotivo('');
            setError('');
        }
    }, [open]);

    if (!open) return null;

    function handleSubmit(e) {
        e.preventDefault();
        const t = motivo.trim();
        if (t.length < 3) {
            setError('Escribe al menos 3 caracteres con el motivo.');
            return;
        }
        setError('');
        onConfirm(t);
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancelar-reserva-titulo"
                className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-neutral-900 shadow-2xl p-5 sm:p-6"
            >
                <h2 id="cancelar-reserva-titulo" className="text-lg font-semibold text-stone-900 dark:text-neutral-50">
                    Cancelar reserva
                </h2>
                <p className="mt-2 text-sm text-stone-600 dark:text-neutral-400">
                    Indica el motivo de la cancelación. Recuerda avisar con al menos 2 horas de antelación cuando sea posible.
                </p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <label className="block">
                        <span className="text-xs font-medium text-stone-600 dark:text-neutral-400">Motivo</span>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            rows={4}
                            maxLength={500}
                            placeholder="Ej.: Cambio de planes, no podré asistir…"
                            className="mt-1 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-neutral-950 px-3 py-2.5 text-sm text-stone-900 dark:text-neutral-50 placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-red-500"
                            autoFocus
                        />
                    </label>
                    {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-medium disabled:opacity-50"
                        >
                            Volver
                        </button>
                        <button
                            type="submit"
                            disabled={busy}
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white py-3 text-sm font-semibold disabled:opacity-50"
                        >
                            {busy ? 'Cancelando…' : 'Confirmar cancelación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/** Panel unificado: reserva activa, vista previa del wizard o última reserva. */
function ResumenReservaPanel({ modo, reserva, preview, onCancelar }) {
    const esPreview = modo === 'preview';
    const esUltima = modo === 'ultima';
    const esActiva = modo === 'activa';

    const titulo = esPreview
        ? 'Vista previa'
        : esActiva
          ? 'Tu reserva'
          : esUltima
            ? 'Última reserva'
            : 'Resumen';

    const slot = preview?.slot ?? (reserva?.fecha_hora ? null : null);
    const slotFromHora = preview?.hora ? TIME_SLOTS.find((s) => s.value === preview.hora) : null;
    const slotLabel = slot
        ? formatSlotLabel(slot)
        : slotFromHora
          ? formatSlotLabel(slotFromHora)
          : reserva?.fecha_hora
            ? franjaDesdeReserva(reserva)
            : null;

    const fechaTexto = preview?.fecha
        ? formatFechaLarga(preview.fecha)
        : reserva?.fecha_hora
          ? formatFechaLarga(String(reserva.fecha_hora).slice(0, 10))
          : null;

    const fechaCompleta = reserva?.fecha_hora ? formatFechaHora(reserva.fecha_hora) : null;
    const personas = preview?.numPersonas ?? reserva?.num_personas;
    const notas = (preview?.notas?.trim?.() || reserva?.notas || '').trim();

    const cardClass = esPreview
        ? 'border-amber-500/35 bg-amber-50/50 dark:bg-amber-950/20'
        : esActiva
          ? 'border-teal-500/30 bg-teal-50/60 dark:bg-teal-950/25'
          : esUltima
            ? 'border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-neutral-900/40'
            : 'border-dashed border-stone-300 dark:border-white/15';

    return (
        <article className={classNames('rounded-2xl border p-4 sm:p-5 shadow-sm', cardClass)}>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <h3
                    className={classNames(
                        'text-base font-semibold',
                        esPreview
                            ? 'text-amber-900 dark:text-amber-100'
                            : esActiva
                              ? 'text-teal-900 dark:text-teal-100'
                              : 'text-stone-900 dark:text-neutral-50',
                    )}
                >
                    {titulo}
                </h3>
                {esPreview ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border border-amber-500/40 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100">
                        En proceso
                    </span>
                ) : reserva?.estado ? (
                    <span
                        className={classNames(
                            'text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border',
                            estadoStyle(reserva.estado),
                        )}
                    >
                        {etiquetaEstadoReserva(reserva.estado)}
                    </span>
                ) : null}
            </div>

            {fechaCompleta && !esPreview ? (
                <p className="text-lg font-semibold text-stone-900 dark:text-neutral-50 mb-3">{fechaCompleta}</p>
            ) : null}

            <div className="rounded-xl bg-white/60 dark:bg-neutral-950/40 px-3 border border-stone-200/60 dark:border-white/10">
                {filaResumen('Fecha', fechaTexto || 'Por elegir', !fechaTexto)}
                {filaResumen('Franja horaria', slotLabel || 'Por elegir', !slotLabel)}
                {filaResumen(
                    'Personas',
                    personas ? `${personas} persona${Number(personas) === 1 ? '' : 's'}` : 'Por elegir',
                    !personas,
                )}
                {filaResumen('Mesa', reserva?.mesa ? `Mesa ${reserva.mesa.numero}` : 'Asignará el restaurante', !reserva?.mesa)}
                {notas
                    ? filaResumen('Notas', notas.length > 48 ? `${notas.slice(0, 45)}…` : notas, false)
                    : esPreview && preview?.paso >= 4
                      ? filaResumen('Notas', 'Sin notas', false)
                      : null}
            </div>

            {esPreview ? (
                <p className="mt-3 text-xs text-amber-800/90 dark:text-amber-200/80 leading-relaxed">
                    Este resumen se actualiza mientras completas los pasos. Al confirmar, quedará guardado así.
                </p>
            ) : esActiva ? (
                <>
                    <p className="mt-3 text-xs text-stone-600 dark:text-neutral-500 leading-relaxed">
                        Solo puedes tener una reserva activa. Cuando termine esta visita podrás reservar de nuevo.
                    </p>
                    {onCancelar ? (
                        <button
                            type="button"
                            onClick={onCancelar}
                            className="mt-4 w-full min-h-[44px] rounded-xl border-2 border-red-600 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                        >
                            Cancelar reserva
                        </button>
                    ) : null}
                </>
            ) : esUltima ? (
                <>
                    <p className="mt-3 text-xs text-stone-600 dark:text-neutral-500 leading-relaxed">
                        Datos de la última reserva que registraste en el sistema.
                    </p>
                    {reserva?.estado === 'CANCELADA' && reserva?.motivo_cancelacion ? (
                        <p className="mt-2 text-xs text-stone-500 dark:text-neutral-500">
                            <span className="font-medium">Motivo de cancelación:</span> {reserva.motivo_cancelacion}
                        </p>
                    ) : null}
                </>
            ) : null}
        </article>
    );
}

function PasoIndicador({ pasoActual }) {
    return (
        <nav aria-label="Progreso de reserva" className="mb-6 sm:mb-8">
            <ol className="flex items-center justify-between gap-1">
                {PASOS.map((p, i) => {
                    const activo = pasoActual === p.id;
                    const hecho = pasoActual > p.id;
                    return (
                        <li key={p.id} className="flex flex-1 flex-col items-center min-w-0">
                            <div className="flex w-full items-center">
                                {i > 0 ? (
                                    <div
                                        className={classNames(
                                            'h-0.5 flex-1',
                                            hecho ? 'bg-teal-500' : 'bg-stone-200 dark:bg-white/10',
                                        )}
                                        aria-hidden
                                    />
                                ) : null}
                                <span
                                    className={classNames(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors',
                                        activo
                                            ? 'border-teal-500 bg-teal-500 text-white'
                                            : hecho
                                              ? 'border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300'
                                              : 'border-stone-300 dark:border-white/20 bg-stone-50 dark:bg-neutral-950 text-stone-500',
                                    )}
                                >
                                    {hecho ? '✓' : p.id}
                                </span>
                                {i < PASOS.length - 1 ? (
                                    <div
                                        className={classNames(
                                            'h-0.5 flex-1',
                                            hecho ? 'bg-teal-500' : 'bg-stone-200 dark:bg-white/10',
                                        )}
                                        aria-hidden
                                    />
                                ) : null}
                            </div>
                            <span
                                className={classNames(
                                    'mt-1.5 text-[9px] sm:text-[10px] font-medium text-center truncate w-full px-0.5',
                                    activo ? 'text-teal-700 dark:text-teal-300' : 'text-stone-500 dark:text-neutral-500',
                                )}
                            >
                                {p.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export function ClienteReservasPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [reservaActiva, setReservaActiva] = useState(null);
    const [ultimaReserva, setUltimaReserva] = useState(null);
    const [puedeReservar, setPuedeReservar] = useState(true);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    const [paso, setPaso] = useState(1);
    const [hora, setHora] = useState('');
    const [numPersonas, setNumPersonas] = useState(2);
    const [fecha, setFecha] = useState('');
    const [notas, setNotas] = useState('');
    const [resultado, setResultado] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const [banner, setBanner] = useState('');

    const minFecha = useMemo(() => minDateLocal(), []);
    const maxFecha = useMemo(() => maxDateLocal(), []);

    const slotElegido = useMemo(() => TIME_SLOTS.find((s) => s.value === hora), [hora]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [me, r] = await Promise.all([apiFetch('/api/auth/me'), apiFetch('/api/cliente/reservas')]);
            setUser(me?.user ?? null);
            setReservaActiva(r?.reserva_activa ?? null);
            setUltimaReserva(r?.ultima_reserva ?? null);
            setPuedeReservar(r?.puede_reservar !== false);
        } catch {
            setReservaActiva(null);
            setUltimaReserva(null);
            setPuedeReservar(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    function reiniciarWizard() {
        setPaso(1);
        setHora('');
        setNumPersonas(2);
        setFecha('');
        setNotas('');
        setResultado(null);
    }

    async function cancelarReserva(motivo) {
        if (!reservaActiva?.idReserva) return;
        setCancelando(true);
        setBanner('');
        try {
            const res = await apiFetch(`/api/cliente/reservas/${reservaActiva.idReserva}/cancelar`, {
                method: 'POST',
                body: JSON.stringify({ motivo }),
            });
            setShowCancelModal(false);
            setReservaActiva(null);
            setPuedeReservar(true);
            setUltimaReserva(res?.data ?? null);
            setBanner(res?.message || 'Reserva cancelada.');
            reiniciarWizard();
            await loadAll();
        } catch (e) {
            setBanner(e?.message || 'No se pudo cancelar la reserva.');
        } finally {
            setCancelando(false);
        }
    }

    async function enviarReserva() {
        setEnviando(true);
        setResultado(null);
        try {
            const res = await apiFetch('/api/cliente/reservas', {
                method: 'POST',
                body: JSON.stringify({
                    fecha,
                    hora,
                    num_personas: Number(numPersonas),
                    notas: notas.trim() || null,
                }),
            });
            setResultado({ ok: true, message: res?.message || 'Tu reserva quedó registrada.' });
            setReservaActiva(res?.data ?? null);
            setPuedeReservar(false);
            setPaso(5);
            await loadAll();
        } catch (e) {
            setResultado({
                ok: false,
                message: e?.message || 'No se pudo procesar tu reserva. Intenta de nuevo o elige otro horario.',
            });
            setPaso(5);
        } finally {
            setEnviando(false);
        }
    }

    function cerrarSesion() {
        clearToken();
        navigate('/cliente', { replace: true });
    }

    const nombreMostrar = user ? [user.nombre, user.apellido].filter(Boolean).join(' ') : '';

    const puedeAvanzarPaso2 = Boolean(hora);
    const puedeAvanzarPaso3 = Number(numPersonas) >= 1 && Number(numPersonas) <= MAX_PERSONAS;
    const puedeAvanzarPaso4 = Boolean(fecha) && fecha >= minFecha && fecha <= maxFecha;

    const mostrarResultado = paso === 5 && resultado;
    const mostrarFormulario = puedeReservar && paso < 5;
    const mostrarWizard = mostrarFormulario || mostrarResultado;

    const resumenPanel = useMemo(() => {
        if (reservaActiva && !mostrarFormulario) {
            return { modo: 'activa', reserva: reservaActiva, preview: null };
        }
        if (mostrarWizard && (mostrarFormulario || (mostrarResultado && resultado?.ok))) {
            return {
                modo: 'preview',
                reserva: resultado?.ok ? reservaActiva : null,
                preview: {
                    hora: hora || null,
                    slot: slotElegido,
                    fecha: fecha || null,
                    numPersonas: numPersonas || null,
                    notas,
                    paso,
                },
            };
        }
        if (ultimaReserva) {
            return { modo: 'ultima', reserva: ultimaReserva, preview: null };
        }
        return { modo: 'empty', reserva: null, preview: null };
    }, [
        reservaActiva,
        ultimaReserva,
        mostrarWizard,
        mostrarFormulario,
        mostrarResultado,
        resultado,
        hora,
        slotElegido,
        fecha,
        numPersonas,
        notas,
        paso,
    ]);

    const subtituloResumen =
        resumenPanel.modo === 'preview'
            ? mostrarResultado && resultado?.ok
                ? 'Así quedó tu reserva registrada'
                : 'Así va quedando tu reserva'
            : resumenPanel.modo === 'activa'
              ? 'Tu próxima visita al restaurante'
              : resumenPanel.modo === 'ultima'
                ? 'Referencia de tu última visita reservada'
                : 'Completa el formulario para ver el resumen';

    return (
        <div className="relative min-h-screen overflow-x-clip bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]" />

            <header className="relative border-b border-stone-200/80 dark:border-white/10 bg-white/75 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-10">
                <div className="mx-auto max-w-6xl px-3 min-[375px]:px-4 sm:px-5 md:px-6 py-3 sm:py-4 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between min-[520px]:gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-stone-500 dark:text-neutral-500">
                            Cliente
                        </div>
                        <div className="text-base sm:text-lg font-semibold text-stone-900 dark:text-neutral-50 break-words line-clamp-2">
                            {nombreMostrar ? `${nombreMostrar} · Reservas` : 'Mis reservas'}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 min-[375px]:gap-2 sm:gap-3 w-full min-[520px]:w-auto min-[520px]:justify-end shrink-0 touch-manipulation">
                        <ThemeToggle />
                        <Link
                            to="/cliente/carta"
                            className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                        >
                            <span className="hidden min-[400px]:inline">Ver carta</span>
                            <span className="min-[400px]:hidden">Carta</span>
                        </Link>
                        <Link
                            to="/cliente"
                            className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                        >
                            Inicio
                        </Link>
                        <button
                            type="button"
                            onClick={cerrarSesion}
                            className="text-[11px] sm:text-sm px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/15 border border-stone-300 dark:border-white/15 whitespace-nowrap"
                        >
                            <span className="sm:hidden">Salir</span>
                            <span className="hidden sm:inline">Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            </header>

            <CancelarReservaModal
                open={showCancelModal}
                busy={cancelando}
                onClose={() => !cancelando && setShowCancelModal(false)}
                onConfirm={cancelarReserva}
            />

            <main className="relative mx-auto max-w-6xl px-3 min-[375px]:px-4 sm:px-5 md:px-6 py-6 sm:py-8 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
                {banner ? (
                    <div className="lg:col-span-2 rounded-xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/30 px-4 py-3 text-sm text-teal-900 dark:text-teal-100">
                        {banner}
                    </div>
                ) : null}
                <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-neutral-900/50 p-4 min-[375px]:p-5 sm:p-6 shadow-sm min-w-0">
                    {mostrarWizard ? (
                        <>
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50">
                                Nueva reserva
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-neutral-400">
                                Completa los pasos. Solo puedes tener una reserva activa a la vez.
                            </p>

                            <PasoIndicador pasoActual={paso} />
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50">
                                Reservar mesa
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-neutral-400">
                                Ya tienes una reserva registrada para tu próxima visita.
                            </p>
                        </>
                    )}

                    {mostrarWizard && paso === 1 ? (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-teal-500/25 bg-teal-50/80 dark:bg-teal-950/25 px-4 py-4 sm:px-5 sm:py-5">
                                <h3 className="text-base font-semibold text-teal-900 dark:text-teal-100">
                                    ¿Cómo funcionan las reservas?
                                </h3>
                                <ul className="mt-3 space-y-2.5 text-sm text-stone-700 dark:text-neutral-300 leading-relaxed list-disc pl-5">
                                    <li>
                                        Deberás elegir en este orden: <strong>horario de visita</strong>,{' '}
                                        <strong>cantidad de personas</strong> y <strong>fecha</strong>.
                                    </li>
                                    <li>
                                        Los horarios son franjas de <strong>1 hora y 30 minutos</strong> (de 10:00 a. m.
                                        a 8:30 p. m.) para organizar mejor el servicio.
                                    </li>
                                    <li>
                                        Puedes reservar con hasta <strong>{MAX_DIAS} días de anticipación</strong>.
                                    </li>
                                    <li>
                                        Solo puedes tener <strong>una reserva activa</strong> a la vez; al guardarla queda
                                        registrada de inmediato.
                                    </li>
                                </ul>
                            </div>
                            <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-4">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Importante</p>
                                <p className="mt-2 text-sm text-amber-950/90 dark:text-amber-100/90 leading-relaxed">
                                    Si no puedes asistir, debes avisar con al menos{' '}
                                    <strong>2 horas de antelación</strong>. De lo contrario, tu cuenta podría quedar{' '}
                                    <strong>suspendida indefinidamente</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPaso(2)}
                                className="w-full min-h-[44px] rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-500 transition-colors"
                            >
                                Comenzar reserva
                            </button>
                        </div>
                    ) : null}

                    {mostrarWizard && paso === 2 ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-stone-900 dark:text-neutral-50">
                                    Paso 2 · Horario de visita
                                </h3>
                                <p className="mt-1 text-sm text-stone-600 dark:text-neutral-400">
                                    Elige una franja de 1 h 30 min. Disponible de 10:00 a. m. a 8:30 p. m.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {TIME_SLOTS.map((slot) => {
                                    const sel = hora === slot.value;
                                    return (
                                        <button
                                            key={slot.value}
                                            type="button"
                                            onClick={() => setHora(slot.value)}
                                            className={classNames(
                                                'rounded-xl border px-4 py-3.5 text-left transition-all touch-manipulation',
                                                sel
                                                    ? 'border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/40 text-teal-900 dark:text-teal-100'
                                                    : 'border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 hover:border-teal-500/50 text-stone-800 dark:text-neutral-200',
                                            )}
                                        >
                                            <span className="block text-xs uppercase tracking-wide text-stone-500 dark:text-neutral-500">
                                                Franja
                                            </span>
                                            <span className="block mt-0.5 text-sm font-semibold">{formatSlotLabel(slot)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaso(1)}
                                    className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-white/15 text-sm font-medium hover:bg-stone-100 dark:hover:bg-white/5"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    disabled={!puedeAvanzarPaso2}
                                    onClick={() => setPaso(3)}
                                    className="flex-1 min-h-[44px] rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-teal-500"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {mostrarWizard && paso === 3 ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-stone-900 dark:text-neutral-50">
                                    Paso 3 · Cantidad de personas
                                </h3>
                                <p className="mt-1 text-sm text-stone-600 dark:text-neutral-400">
                                    ¿Cuántas personas asistirán al restaurante?
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-4 py-4">
                                <button
                                    type="button"
                                    onClick={() => setNumPersonas((n) => Math.max(1, Number(n) - 1))}
                                    disabled={Number(numPersonas) <= 1}
                                    className="h-12 w-12 rounded-xl border border-stone-200 dark:border-white/15 text-xl font-bold disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-white/5"
                                    aria-label="Menos personas"
                                >
                                    −
                                </button>
                                <div className="text-center min-w-[5rem]">
                                    <span className="text-4xl font-bold tabular-nums text-teal-700 dark:text-teal-300">
                                        {numPersonas}
                                    </span>
                                    <p className="text-xs text-stone-500 mt-1">personas</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNumPersonas((n) => Math.min(MAX_PERSONAS, Number(n) + 1))}
                                    disabled={Number(numPersonas) >= MAX_PERSONAS}
                                    className="h-12 w-12 rounded-xl border border-stone-200 dark:border-white/15 text-xl font-bold disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-white/5"
                                    aria-label="Más personas"
                                >
                                    +
                                </button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {[2, 4, 6, 8, 10].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setNumPersonas(n)}
                                        className={classNames(
                                            'rounded-lg px-3 py-1.5 text-sm font-medium border',
                                            Number(numPersonas) === n
                                                ? 'border-teal-500 bg-teal-500/15 text-teal-800 dark:text-teal-200'
                                                : 'border-stone-200 dark:border-white/15 hover:border-teal-500/40',
                                        )}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaso(2)}
                                    className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-white/15 text-sm font-medium"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    disabled={!puedeAvanzarPaso3}
                                    onClick={() => {
                                        if (!fecha) setFecha(minFecha);
                                        setPaso(4);
                                    }}
                                    className="flex-1 min-h-[44px] rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-teal-500"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {mostrarWizard && paso === 4 ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-stone-900 dark:text-neutral-50">
                                    Paso 4 · Fecha de la reserva
                                </h3>
                                <p className="mt-1 text-sm text-stone-600 dark:text-neutral-400">
                                    Máximo {MAX_DIAS} días desde hoy ({formatFechaLarga(minFecha)} –{' '}
                                    {formatFechaLarga(maxFecha)}).
                                </p>
                            </div>

                            <div className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-neutral-950/40 p-4 space-y-2 text-sm">
                                <p>
                                    <span className="text-stone-500 dark:text-neutral-500">Horario:</span>{' '}
                                    <strong>{slotElegido ? formatSlotLabel(slotElegido) : '—'}</strong>
                                </p>
                                <p>
                                    <span className="text-stone-500 dark:text-neutral-500">Personas:</span>{' '}
                                    <strong>{numPersonas}</strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={minFecha}
                                    max={maxFecha}
                                    value={fecha}
                                    onChange={(ev) => setFecha(ev.target.value)}
                                    className="mt-1.5 w-full min-h-[2.75rem] rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={notas}
                                    onChange={(ev) => setNotas(ev.target.value)}
                                    maxLength={500}
                                    placeholder="Celebración, alergias, etc."
                                    className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 resize-y"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaso(3)}
                                    className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-white/15 text-sm font-medium"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    disabled={!puedeAvanzarPaso4 || enviando}
                                    onClick={enviarReserva}
                                    className="flex-1 min-h-[44px] rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-teal-500"
                                >
                                    {enviando ? 'Procesando…' : 'Confirmar reserva'}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {mostrarWizard && paso === 5 && resultado ? (
                        <div className="space-y-5 text-center py-4">
                            {resultado.ok ? (
                                <>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
                                        ✓
                                    </div>
                                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                                        Reserva registrada
                                    </h3>
                                    <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                                        {resultado.message}
                                    </p>
                                    {slotElegido && fecha ? (
                                        <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                                            {formatFechaLarga(fecha)} · {formatSlotLabel(slotElegido)} · {numPersonas}{' '}
                                            persona{Number(numPersonas) === 1 ? '' : 's'}
                                        </p>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-3xl text-red-600">
                                        ✕
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                                        No se pudo procesar la reserva
                                    </h3>
                                    <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                                        {resultado.message}
                                    </p>
                                </>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                                {resultado.ok ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaso(1);
                                            setResultado(null);
                                        }}
                                        className="min-h-[44px] rounded-xl px-6 bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
                                    >
                                        Ver mi reserva
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={reiniciarWizard}
                                        className="min-h-[44px] rounded-xl px-6 bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
                                    >
                                        Intentar de nuevo
                                    </button>
                                )}
                                {!resultado.ok ? (
                                    <button
                                        type="button"
                                        onClick={() => setPaso(2)}
                                        className="min-h-[44px] rounded-xl px-6 border border-stone-200 dark:border-white/15 text-sm font-medium"
                                    >
                                        Cambiar horario
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className="min-w-0 lg:sticky lg:top-24">
                    <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50">Mi reserva</h2>
                    <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-neutral-400">{subtituloResumen}</p>

                    <div className="mt-5 sm:mt-6">
                        {loading ? (
                            <p className="text-stone-500 dark:text-neutral-500 py-8">Cargando…</p>
                        ) : resumenPanel.modo === 'empty' ? (
                            <p className="text-stone-600 dark:text-neutral-400 rounded-2xl border border-dashed border-stone-300 dark:border-white/15 px-4 py-8 text-center text-sm leading-relaxed">
                                Aún no hay datos que mostrar. Elige horario, personas y fecha en el formulario.
                            </p>
                        ) : (
                            <ResumenReservaPanel
                                modo={resumenPanel.modo}
                                reserva={resumenPanel.reserva}
                                preview={resumenPanel.preview}
                                onCancelar={
                                    resumenPanel.modo === 'activa' && reservaActiva?.idReserva
                                        ? () => setShowCancelModal(true)
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
