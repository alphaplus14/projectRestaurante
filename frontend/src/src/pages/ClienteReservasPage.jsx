import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function minDateLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
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

function estadoStyle(estado) {
    const e = String(estado || '').toUpperCase();
    if (e === 'CONFIRMADA') {
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30';
    }
    if (e === 'SOLICITADA') return 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30';
    if (e === 'CANCELADA' || e === 'RECHAZADA') {
        return 'bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-neutral-300 border-stone-300 dark:border-white/15';
    }
    return 'bg-stone-100 text-stone-800 dark:bg-white/10 dark:text-neutral-200 border-stone-200 dark:border-white/10';
}

export function ClienteReservasPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [mesas, setMesas] = useState([]);
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');
    const [okMsg, setOkMsg] = useState('');

    const minFecha = useMemo(() => minDateLocal(), []);

    const [fecha, setFecha] = useState(() => minDateLocal());
    const [hora, setHora] = useState('19:30');
    const [mesaId, setMesaId] = useState('');
    const [numPersonas, setNumPersonas] = useState(2);
    const [notas, setNotas] = useState('');

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [me, m, r] = await Promise.all([
                apiFetch('/api/auth/me'),
                apiFetch('/api/cliente/mesas'),
                apiFetch('/api/cliente/reservas'),
            ]);
            setUser(me?.user ?? null);
            setMesas(Array.isArray(m?.data) ? m.data : []);
            setLista(Array.isArray(r?.data) ? r.data : []);
        } catch (e) {
            setError(e?.message || 'No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setOkMsg('');
        setEnviando(true);
        try {
            const payload = {
                fecha,
                hora,
                num_personas: Number(numPersonas),
                notas: notas.trim() || null,
            };
            if (mesaId !== '') {
                payload.mesa_idMesa = Number(mesaId);
            }

            const res = await apiFetch('/api/cliente/reservas', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setOkMsg(res?.message || 'Reserva enviada.');
            await loadAll();
            setNotas('');
        } catch (e) {
            setError(e?.message || 'No se pudo registrar la reserva.');
        } finally {
            setEnviando(false);
        }
    }

    function cerrarSesion() {
        clearToken();
        navigate('/cliente', { replace: true });
    }

    const nombreMostrar = user ? [user.nombre, user.apellido].filter(Boolean).join(' ') : '';

    const mesaElegida = mesas.find((m) => String(m.idMesa) === String(mesaId));
    const capMax = mesaElegida ? Number(mesaElegida.capacidad) || 40 : 40;

    return (
        <div className="relative min-h-screen overflow-x-clip bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]" />

            <header className="relative border-b border-stone-200/80 dark:border-white/10 bg-white/75 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-10">
                <div className="mx-auto max-w-6xl px-3 min-[375px]:px-4 sm:px-5 md:px-6 py-3 sm:py-4 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between min-[520px]:gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-stone-500 dark:text-neutral-500">Cliente</div>
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

            <main className="relative mx-auto max-w-6xl px-3 min-[375px]:px-4 sm:px-5 md:px-6 py-6 sm:py-8 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
                <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-neutral-900/50 p-4 min-[375px]:p-5 sm:p-6 shadow-sm min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50">Nueva reserva</h2>
                    <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-neutral-400 leading-relaxed">
                        Envía tu solicitud. El restaurante la revisará y podrá confirmarla según disponibilidad.
                    </p>

                    <form className="mt-5 sm:mt-6 space-y-4" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="min-w-0">
                                <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    min={minFecha}
                                    value={fecha}
                                    onChange={(ev) => setFecha(ev.target.value)}
                                    className="mt-1.5 w-full min-h-[2.75rem] rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40"
                                />
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Hora</label>
                                <input
                                    type="time"
                                    required
                                    value={hora}
                                    onChange={(ev) => setHora(ev.target.value)}
                                    className="mt-1.5 w-full min-h-[2.75rem] rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40"
                                />
                            </div>
                        </div>

                        <div className="min-w-0">
                            <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Mesa (opcional)</label>
                            <select
                                value={mesaId}
                                onChange={(ev) => setMesaId(ev.target.value)}
                                className="mt-1.5 w-full min-h-[2.75rem] rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40 max-w-full"
                            >
                                <option value="">Preferencia abierta — asignará el restaurante</option>
                                {mesas.map((m) => (
                                    <option key={m.idMesa} value={m.idMesa}>
                                        {m.label ?? `Mesa ${m.numero}`} (hasta {m.capacidad} pers.)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-0">
                            <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">
                                Personas {mesaElegida ? `(máx. ${capMax})` : null}
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={capMax}
                                value={numPersonas}
                                onChange={(ev) => setNumPersonas(ev.target.value)}
                                className="mt-1.5 w-full min-h-[2.75rem] rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40"
                                inputMode="numeric"
                            />
                        </div>

                        <div className="min-w-0">
                            <label className="block text-sm font-medium text-stone-800 dark:text-neutral-200">Notas (opcional)</label>
                            <textarea
                                rows={3}
                                value={notas}
                                onChange={(ev) => setNotas(ev.target.value)}
                                maxLength={500}
                                placeholder="Alergias, celebración, llegada aproximada…"
                                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-950/40 px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40 resize-y min-h-[5.5rem]"
                            />
                        </div>

                        {error ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                                {error}
                            </div>
                        ) : null}
                        {okMsg ? (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                                {okMsg}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={enviando || loading}
                            className={classNames(
                                'w-full sm:w-auto min-h-[44px] rounded-xl px-6 py-3 sm:py-2.5 text-base sm:text-sm font-semibold transition-colors touch-manipulation',
                                'bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed',
                            )}
                        >
                            {enviando ? 'Enviando…' : 'Solicitar reserva'}
                        </button>
                    </form>
                </section>

                <section className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50">Mis solicitudes</h2>
                    <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-neutral-400">Historial reciente.</p>

                    <div className="mt-5 sm:mt-6 space-y-3">
                        {loading ? (
                            <p className="text-stone-500 dark:text-neutral-500 py-8">Cargando…</p>
                        ) : lista.length === 0 ? (
                            <p className="text-stone-600 dark:text-neutral-400 rounded-2xl border border-dashed border-stone-300 dark:border-white/15 px-4 py-8 text-center">
                                Aún no tienes reservas registradas desde la web.
                            </p>
                        ) : (
                            lista.map((r) => (
                                <article
                                    key={r.idReserva}
                                    className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-neutral-900/40 p-3.5 sm:p-4 shadow-sm min-w-0"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="font-medium text-stone-900 dark:text-neutral-50 text-sm sm:text-base min-w-0 break-words pr-2">
                                            {formatFechaHora(r.fecha_hora)}
                                        </div>
                                        <span
                                            className={classNames(
                                                'text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0',
                                                estadoStyle(r.estado),
                                            )}
                                        >
                                            {r.estado}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-neutral-400 break-words">
                                        {r.num_personas} persona{r.num_personas === 1 ? '' : 's'}
                                        {r.mesa
                                            ? ` · ${r.mesa.nombre ? `Mesa ${r.mesa.numero} (${r.mesa.nombre})` : `Mesa ${r.mesa.numero}`}`
                                            : ' · Mesa por asignar'}
                                    </p>
                                    {r.notas ? (
                                        <p className="mt-2 text-sm text-stone-500 dark:text-neutral-500 italic">
                                            &ldquo;{r.notas}&rdquo;
                                        </p>
                                    ) : null}
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
