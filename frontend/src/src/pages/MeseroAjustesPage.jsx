import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { logoutTenantSession } from '../auth/logoutSession';
import { ThemeToggle } from '../theme/ThemeToggle';
import { confirmStaffLogout } from '../utils/confirmLogout';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const ESTADO_LABEL = {
    PENDIENTE: 'Enviado a cocina',
    EN_PREPARACION: 'En preparación',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
};

const HISTORIAL_PAGE_SIZE = 8;

const FILTROS_ESTADO = [
    { value: 'todas', label: 'Todos' },
    { value: 'CERRADO', label: 'Cerrados' },
    { value: 'ENTREGADO', label: 'Entregados' },
    { value: 'CANCELADO', label: 'Cancelados' },
    { value: 'LISTO', label: 'Listos' },
    { value: 'EN_PREPARACION', label: 'En preparación' },
    { value: 'PENDIENTE', label: 'Pendientes' },
];

function formatMesa(mesa) {
    if (!mesa) return '—';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return 'Mesa';
}

function formatMoney(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
        Number(n),
    );
}

function formatFechaHora(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-CO', {
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

function CampoPerfil({ label, value }) {
    return (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900 dark:text-stone-50 break-words">{value || '—'}</dd>
        </div>
    );
}

export function MeseroAjustesPage() {
    const [perfil, setPerfil] = useState(null);
    const [perfilError, setPerfilError] = useState('');
    const [historial, setHistorial] = useState([]);
    const [historialError, setHistorialError] = useState('');
    const [loadingPerfil, setLoadingPerfil] = useState(true);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const [estado, setEstado] = useState('todas');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [orden, setOrden] = useState('reciente');
    const [pagina, setPagina] = useState(1);

    const totalPaginas = useMemo(
        () => Math.max(1, Math.ceil(historial.length / HISTORIAL_PAGE_SIZE)),
        [historial.length],
    );

    const historialPagina = useMemo(() => {
        const start = (pagina - 1) * HISTORIAL_PAGE_SIZE;
        return historial.slice(start, start + HISTORIAL_PAGE_SIZE);
    }, [historial, pagina]);

    const loadPerfil = useCallback(async () => {
        setLoadingPerfil(true);
        setPerfilError('');
        try {
            const res = await apiFetch('/api/mesero/perfil');
            setPerfil(res?.data ?? null);
        } catch (e) {
            setPerfil(null);
            setPerfilError(e?.message || 'No se pudo cargar tu perfil.');
        } finally {
            setLoadingPerfil(false);
        }
    }, []);

    const loadHistorial = useCallback(async () => {
        setLoadingHistorial(true);
        setHistorialError('');
        try {
            const params = new URLSearchParams();
            if (estado) params.set('estado', estado);
            if (desde) params.set('desde', desde);
            if (hasta) params.set('hasta', hasta);
            if (orden) params.set('orden', orden);
            const res = await apiFetch(`/api/mesero/pedidos/historial?${params}`);
            setHistorial(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            setHistorial([]);
            setHistorialError(e?.message || 'No se pudo cargar el historial.');
        } finally {
            setLoadingHistorial(false);
        }
    }, [estado, desde, hasta, orden]);

    useEffect(() => {
        void loadPerfil();
    }, [loadPerfil]);

    useEffect(() => {
        void loadHistorial();
    }, [loadHistorial]);

    useEffect(() => {
        setPagina(1);
    }, [estado, desde, hasta, orden]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    async function onSalir() {
        await logoutTenantSession();
        window.location.href = '/staff?rol=mesero';
    }

    async function solicitarSalir() {
        const ok = await confirmStaffLogout();
        if (ok) await onSalir();
    }

    const nombreCompleto = perfil ? `${perfil.nombre ?? ''} ${perfil.apellido ?? ''}`.trim() : '';

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            to="/mesero"
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                            ← Salón
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-semibold truncate">Ajustes</h1>
                            <p className="text-xs text-stone-600 dark:text-stone-400">Perfil e historial de pedidos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => void solicitarSalir()}
                            aria-label="Cerrar sesión"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-600/80 bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 px-3 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
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

            <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
                <section aria-labelledby="perfil-mesero-titulo">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/ajustes.png" alt="" className="h-6 w-6 object-contain dark:invert" />
                        <h2 id="perfil-mesero-titulo" className="text-lg font-semibold">
                            Mi perfil
                        </h2>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                        Solo lectura. Para cambiar tus datos contacta al administrador.
                    </p>
                    {perfilError ? (
                        <p className="text-sm text-red-700 dark:text-red-300 rounded-xl border border-red-300/50 px-3 py-2">
                            {perfilError}
                        </p>
                    ) : loadingPerfil ? (
                        <p className="text-sm text-stone-500">Cargando perfil…</p>
                    ) : (
                        <dl className="grid sm:grid-cols-2 gap-3">
                            <CampoPerfil label="Nombre completo" value={nombreCompleto} />
                            <CampoPerfil label="Correo" value={perfil?.correo} />
                            <CampoPerfil label="Cédula" value={perfil?.cedula} />
                            <CampoPerfil label="Teléfono" value={perfil?.telefono} />
                            <CampoPerfil label="Rol" value={perfil?.rol} />
                            <CampoPerfil
                                label="Estado"
                                value={perfil?.activo ? 'Activo' : 'Inactivo'}
                            />
                        </dl>
                    )}
                </section>

                <section aria-labelledby="historial-mesero-titulo">
                    <h2 id="historial-mesero-titulo" className="text-lg font-semibold mb-1">
                        Historial de pedidos
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                        Pedidos que has tomado en el salón.
                    </p>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3 mb-4">
                        <div className="flex flex-wrap gap-2">
                            {FILTROS_ESTADO.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setEstado(f.value)}
                                    className={classNames(
                                        'rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                                        estado === f.value
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                                            : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300',
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="text-sm">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Desde</span>
                                <input
                                    type="date"
                                    value={desde}
                                    onChange={(e) => setDesde(e.target.value)}
                                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Hasta</span>
                                <input
                                    type="date"
                                    value={hasta}
                                    onChange={(e) => setHasta(e.target.value)}
                                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Orden</span>
                                <select
                                    value={orden}
                                    onChange={(e) => setOrden(e.target.value)}
                                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                                >
                                    <option value="reciente">Más recientes</option>
                                    <option value="antiguo">Más antiguos</option>
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setDesde('');
                                    setHasta('');
                                    setEstado('todas');
                                    setOrden('reciente');
                                    setPagina(1);
                                }}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-xs text-stone-600 dark:text-stone-400"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>

                    {historialError ? (
                        <p className="text-sm text-red-700 dark:text-red-300 rounded-xl border border-red-300/50 px-3 py-2">
                            {historialError}
                        </p>
                    ) : null}

                    {loadingHistorial ? (
                        <p className="text-sm text-stone-500 py-8 text-center">Cargando historial…</p>
                    ) : historial.length === 0 ? (
                        <p className="text-sm text-stone-600 dark:text-stone-400 py-8 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                            No hay pedidos con estos filtros.
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 tabular-nums">
                                {historial.length} pedido{historial.length !== 1 ? 's' : ''}
                                {historial.length > HISTORIAL_PAGE_SIZE
                                    ? ` · página ${pagina} de ${totalPaginas}`
                                    : ''}
                            </p>
                            <ul className="space-y-3">
                            {historialPagina.map((p) => {
                                const esCancelado = p.estado === 'CANCELADO';
                                return (
                                    <li
                                        key={p.idPedido}
                                        className={classNames(
                                            'rounded-xl border p-4',
                                            esCancelado
                                                ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
                                        )}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <span className="font-bold text-stone-900 dark:text-stone-50">
                                                    Pedido #{p.idPedido}
                                                </span>
                                                <span className="ml-2 text-sm text-stone-600 dark:text-stone-400">
                                                    {formatMesa(p.mesa)}
                                                </span>
                                            </div>
                                            <span
                                                className={classNames(
                                                    'text-[10px] uppercase font-semibold px-2 py-0.5 rounded',
                                                    esCancelado
                                                        ? 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100'
                                                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
                                                )}
                                            >
                                                {ESTADO_LABEL[p.estado] ?? p.estado}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                                            {formatFechaHora(p.creado_en)}
                                            {p.num_lineas != null
                                                ? ` · ${p.num_lineas} línea${p.num_lineas !== 1 ? 's' : ''} · ${p.total_unidades} u.`
                                                : ''}
                                            {p.subtotal_cop != null ? ` · ${formatMoney(p.subtotal_cop)}` : ''}
                                        </p>
                                        {p.resumen_productos ? (
                                            <p className="text-sm text-stone-800 dark:text-stone-200 mt-2 line-clamp-2">
                                                {p.resumen_productos}
                                            </p>
                                        ) : null}
                                        {esCancelado && p.motivo_cancelacion ? (
                                            <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                                                {p.motivo_cancelacion}
                                            </p>
                                        ) : null}
                                    </li>
                                );
                            })}
                            </ul>
                            {historial.length > HISTORIAL_PAGE_SIZE ? (
                                <div className="flex items-center justify-center gap-3 pt-4">
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
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
