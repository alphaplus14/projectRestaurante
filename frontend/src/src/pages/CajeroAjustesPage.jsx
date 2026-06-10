import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { logoutTenantSession } from '../auth/logoutSession';
import { ThemeToggle } from '../theme/ThemeToggle';
import { confirmStaffLogout } from '../utils/confirmLogout';
import { FacturaModal } from '../components/FacturaModal';

const METODOS_PAGO = [
    { value: '', label: 'Todos' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'DAVIPLATA', label: 'Daviplata' },
];

const VENTAS_PAGE_SIZE = 8;

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatMesa(mesa) {
    if (!mesa) return '—';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return `Mesa #${mesa.idMesa}`;
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

function hoyLocal() {
    return new Date().toISOString().slice(0, 10);
}

function CampoPerfil({ label, value }) {
    return (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900 dark:text-stone-50 break-words">{value || '—'}</dd>
        </div>
    );
}

function ModalCancelarVenta({ open, venta, busy, error, onClose, onConfirm }) {
    const [motivo, setMotivo] = useState('');

    useEffect(() => {
        if (open) setMotivo('');
    }, [open, venta?.idVenta]);

    if (!open || !venta) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-red-300 dark:border-red-800 bg-white dark:bg-stone-900 shadow-2xl p-5 space-y-4"
            >
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Cancelar venta #{venta.idVenta}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                    Indica el motivo. Quedará en el historial y el administrador será notificado.
                </p>
                <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={4}
                    placeholder="Ej: Cobro duplicado, error en el monto…"
                    className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                />
                {error ? (
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                ) : null}
                <div className="flex gap-2">
                    <button type="button" onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm disabled:opacity-50">
                        Volver
                    </button>
                    <button
                        type="button"
                        disabled={busy || motivo.trim().length < 5}
                        onClick={() => onConfirm(motivo.trim())}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white py-3 text-sm font-semibold disabled:opacity-50"
                    >
                        {busy ? 'Cancelando…' : 'Confirmar cancelación'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CajeroAjustesPage() {
    const [perfil, setPerfil] = useState(null);
    const [perfilError, setPerfilError] = useState('');
    const [loadingPerfil, setLoadingPerfil] = useState(true);

    const [mesas, setMesas] = useState([]);
    const [resumenMesas, setResumenMesas] = useState({ total: 0, libres: 0, ocupadas: 0 });
    const [mesasError, setMesasError] = useState('');
    const [loadingMesas, setLoadingMesas] = useState(true);

    const [ventas, setVentas] = useState([]);
    const [resumenVentas, setResumenVentas] = useState({ total_periodo: 0, num_ventas: 0, num_canceladas: 0 });
    const [ventasError, setVentasError] = useState('');
    const [loadingVentas, setLoadingVentas] = useState(true);

    const [desde, setDesde] = useState(hoyLocal);
    const [hasta, setHasta] = useState(hoyLocal);
    const [nombre, setNombre] = useState('');
    const [producto, setProducto] = useState('');
    const [metodo, setMetodo] = useState('');
    const [pagina, setPagina] = useState(1);
    const [ventaCancelar, setVentaCancelar] = useState(null);
    const [cancelandoVenta, setCancelandoVenta] = useState(false);
    const [cancelarError, setCancelarError] = useState('');
    const [facturaModal, setFacturaModal] = useState(false);
    const [facturaActiva, setFacturaActiva] = useState(null);
    const [loadingFactura, setLoadingFactura] = useState(false);
    const [facturaError, setFacturaError] = useState('');

    const totalPaginas = useMemo(
        () => Math.max(1, Math.ceil(ventas.length / VENTAS_PAGE_SIZE)),
        [ventas.length],
    );

    const ventasPagina = useMemo(() => {
        const start = (pagina - 1) * VENTAS_PAGE_SIZE;
        return ventas.slice(start, start + VENTAS_PAGE_SIZE);
    }, [ventas, pagina]);

    const loadPerfil = useCallback(async () => {
        setLoadingPerfil(true);
        setPerfilError('');
        try {
            const res = await apiFetch('/api/cajero/perfil');
            setPerfil(res?.data ?? null);
        } catch (e) {
            setPerfil(null);
            setPerfilError(e?.message || 'No se pudo cargar tu perfil.');
        } finally {
            setLoadingPerfil(false);
        }
    }, []);

    const loadMesas = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoadingMesas(true);
        setMesasError('');
        try {
            const res = await apiFetch('/api/cajero/mesas');
            setMesas(Array.isArray(res?.data) ? res.data : []);
            setResumenMesas(res?.resumen ?? { total: 0, libres: 0, ocupadas: 0 });
        } catch (e) {
            setMesas([]);
            setMesasError(e?.message || 'No se pudieron cargar las mesas.');
        } finally {
            if (!silent) setLoadingMesas(false);
        }
    }, []);

    const loadVentas = useCallback(async () => {
        setLoadingVentas(true);
        setVentasError('');
        try {
            const params = new URLSearchParams();
            if (desde) params.set('desde', desde);
            if (hasta) params.set('hasta', hasta);
            if (nombre.trim()) params.set('nombre', nombre.trim());
            if (producto.trim()) params.set('producto', producto.trim());
            if (metodo) params.set('metodo', metodo);
            const res = await apiFetch(`/api/cajero/ventas?${params}`);
            setVentas(Array.isArray(res?.data) ? res.data : []);
            setResumenVentas({
                total_periodo: res?.total_periodo ?? 0,
                num_ventas: res?.num_ventas ?? 0,
                num_canceladas: res?.num_canceladas ?? 0,
            });
        } catch (e) {
            setVentas([]);
            setVentasError(e?.message || 'No se pudieron cargar las ventas.');
        } finally {
            setLoadingVentas(false);
        }
    }, [desde, hasta, nombre, producto, metodo]);

    useEffect(() => {
        void loadPerfil();
    }, [loadPerfil]);

    useEffect(() => {
        void loadMesas();
        const id = setInterval(() => void loadMesas({ silent: true }), 15000);
        return () => clearInterval(id);
    }, [loadMesas]);

    useEffect(() => {
        void loadVentas();
    }, [loadVentas]);

    useEffect(() => {
        setPagina(1);
    }, [desde, hasta, nombre, producto, metodo]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    async function onSalir() {
        await logoutTenantSession();
        window.location.href = '/staff?rol=cajero';
    }

    async function solicitarSalir() {
        const ok = await confirmStaffLogout();
        if (ok) await onSalir();
    }

    async function confirmarCancelarVenta(motivo) {
        if (!ventaCancelar?.idVenta) return;
        setCancelandoVenta(true);
        setCancelarError('');
        try {
            await apiFetch(`/api/cajero/ventas/${ventaCancelar.idVenta}/cancelar`, {
                method: 'POST',
                body: JSON.stringify({ motivo }),
            });
            setVentaCancelar(null);
            await loadVentas();
        } catch (e) {
            setCancelarError(e?.message || 'No se pudo cancelar la venta.');
        } finally {
            setCancelandoVenta(false);
        }
    }

    async function verFactura(venta) {
        setFacturaModal(true);
        setFacturaActiva(null);
        setFacturaError('');
        setLoadingFactura(true);
        try {
            const res = await apiFetch(`/api/cajero/ventas/${venta.idVenta}/factura`);
            setFacturaActiva(res?.data ?? null);
        } catch (e) {
            setFacturaError(e?.message || 'No se pudo cargar la factura.');
        } finally {
            setLoadingFactura(false);
        }
    }

    function limpiarFiltrosVentas() {
        const hoy = hoyLocal();
        setDesde(hoy);
        setHasta(hoy);
        setNombre('');
        setProducto('');
        setMetodo('');
        setPagina(1);
    }

    const nombreCompleto = perfil ? `${perfil.nombre ?? ''} ${perfil.apellido ?? ''}`.trim() : '';

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-4xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            to="/cajero"
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                            ← Caja
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-semibold truncate">Ajustes</h1>
                            <p className="text-xs text-stone-600 dark:text-stone-400">Perfil, mesas y ventas</p>
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

            <main className="mx-auto max-w-4xl px-4 py-6 space-y-8">
                <section aria-labelledby="perfil-cajero-titulo">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/ajustes.png" alt="" className="h-6 w-6 object-contain dark:invert" />
                        <h2 id="perfil-cajero-titulo" className="text-lg font-semibold">
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
                            <CampoPerfil label="Estado" value={perfil?.activo ? 'Activo' : 'Inactivo'} />
                        </dl>
                    )}
                </section>

                <section aria-labelledby="mesas-cajero-titulo">
                    <h2 id="mesas-cajero-titulo" className="text-lg font-semibold mb-1">
                        Estado de mesas
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                        Consulta rápida para atender clientes en recepción. Se actualiza cada 15 s.
                    </p>

                    {mesasError ? (
                        <p className="text-sm text-red-700 dark:text-red-300 rounded-xl border border-red-300/50 px-3 py-2 mb-4">
                            {mesasError}
                        </p>
                    ) : null}

                    <div className="mb-4 flex flex-wrap gap-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
                        <div>
                            <div className="text-xs text-stone-500 uppercase tracking-wide">Total</div>
                            <div className="text-xl font-bold tabular-nums">{resumenMesas.total}</div>
                        </div>
                        <div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Libres</div>
                            <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                                {resumenMesas.libres}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide">Ocupadas</div>
                            <div className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                                {resumenMesas.ocupadas}
                            </div>
                        </div>
                    </div>

                    {loadingMesas ? (
                        <p className="text-sm text-stone-500 py-6 text-center">Cargando mesas…</p>
                    ) : mesas.length === 0 ? (
                        <p className="text-sm text-stone-500 py-6 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                            No hay mesas activas.
                        </p>
                    ) : (
                        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {mesas.map((m) => {
                                const libre = m.estado === 'LIBRE';
                                return (
                                    <li
                                        key={m.idMesa}
                                        className={classNames(
                                            'rounded-xl border px-3 py-3 text-center',
                                            libre
                                                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30'
                                                : 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30',
                                        )}
                                    >
                                        <div className="font-semibold text-stone-900 dark:text-stone-50">
                                            {formatMesa(m)}
                                        </div>
                                        <div
                                            className={classNames(
                                                'mt-1 text-xs font-medium',
                                                libre
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-amber-700 dark:text-amber-300',
                                            )}
                                        >
                                            {libre ? 'Disponible' : 'Ocupada'}
                                        </div>
                                        {m.capacidad ? (
                                            <div className="mt-1 text-[11px] text-stone-500">{m.capacidad} personas</div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="ventas-cajero-titulo">
                    <h2 id="ventas-cajero-titulo" className="text-lg font-semibold mb-1">
                        Mis ventas
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                        Ventas que has registrado. Filtra por fecha, mesero, producto o método de pago.
                    </p>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3 mb-4">
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
                            <label className="text-sm flex-1 min-w-[140px]">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Mesero o mesa</span>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Buscar…"
                                    className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm flex-1 min-w-[140px]">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Producto</span>
                                <input
                                    type="text"
                                    value={producto}
                                    onChange={(e) => setProducto(e.target.value)}
                                    placeholder="Buscar…"
                                    className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm">
                                <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Pago</span>
                                <select
                                    value={metodo}
                                    onChange={(e) => setMetodo(e.target.value)}
                                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                                >
                                    {METODOS_PAGO.map((m) => (
                                        <option key={m.value || 'todos'} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={limpiarFiltrosVentas}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-xs text-stone-600 dark:text-stone-400"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-6 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
                        <div>
                            <div className="text-xs text-stone-500 uppercase tracking-wide">Total filtrado</div>
                            <div className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                                {formatMoney(resumenVentas.total_periodo)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 uppercase tracking-wide">Transacciones</div>
                            <div className="text-2xl font-bold tabular-nums">{resumenVentas.num_ventas}</div>
                        </div>
                        {resumenVentas.num_canceladas > 0 ? (
                            <div>
                                <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Canceladas</div>
                                <div className="text-2xl font-bold tabular-nums text-red-700 dark:text-red-300">{resumenVentas.num_canceladas}</div>
                            </div>
                        ) : null}
                    </div>

                    {ventasError ? (
                        <p className="text-sm text-red-700 dark:text-red-300 rounded-xl border border-red-300/50 px-3 py-2">
                            {ventasError}
                        </p>
                    ) : null}

                    {loadingVentas ? (
                        <p className="text-sm text-stone-500 py-8 text-center">Cargando ventas…</p>
                    ) : ventas.length === 0 ? (
                        <p className="text-sm text-stone-600 dark:text-stone-400 py-8 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                            No hay ventas con estos filtros.
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 tabular-nums">
                                {ventas.length} venta{ventas.length !== 1 ? 's' : ''}
                                {ventas.length > VENTAS_PAGE_SIZE ? ` · página ${pagina} de ${totalPaginas}` : ''}
                            </p>
                            <ul className="space-y-3">
                                {ventasPagina.map((v) => {
                                    const cancelada = v.estado === 'CANCELADA';
                                    return (
                                    <li
                                        key={v.idVenta}
                                        className={classNames(
                                            'rounded-xl border p-4',
                                            cancelada
                                                ? 'border-red-300 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20'
                                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
                                        )}
                                    >
                                        <div className="flex flex-wrap justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-stone-900 dark:text-stone-50">
                                                        {formatMesa(v.pedido?.mesa)} · Pedido #{v.pedido?.idPedido}
                                                    </span>
                                                    <span
                                                        className={classNames(
                                                            'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border',
                                                            cancelada
                                                                ? 'border-red-400/50 text-red-800 dark:text-red-200'
                                                                : 'border-emerald-400/50 text-emerald-800 dark:text-emerald-200',
                                                        )}
                                                    >
                                                        {cancelada ? 'Cancelada' : 'Activa'}
                                                    </span>
                                                </div>
                                                {v.pedido?.mesero ? (
                                                    <div className="mt-0.5 text-xs text-stone-500">
                                                        Mesero: {v.pedido.mesero.nombre} {v.pedido.mesero.apellido}
                                                    </div>
                                                ) : null}
                                                <div className="mt-1 text-xs text-stone-500">{formatFechaHora(v.registrada_en)}</div>
                                            </div>
                                            <div className={classNames('font-bold tabular-nums', cancelada ? 'text-stone-500 line-through' : 'text-blue-700 dark:text-blue-300')}>
                                                {formatMoney(v.total)}
                                            </div>
                                        </div>
                                        {(v.pedido?.detalles ?? []).length > 0 ? (
                                            <ul className="mt-2 text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                                                {v.pedido.detalles.map((d) => (
                                                    <li key={d.idPedidoDetalle}>
                                                        {d.producto?.nombreProducto ?? 'Ítem'} ×{d.cantidad}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
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
                                        {cancelada && v.motivo_cancelacion ? (
                                            <p className="mt-2 text-xs text-red-800 dark:text-red-200 border-t border-red-200 dark:border-red-900/50 pt-2">
                                                <span className="font-semibold">Motivo: </span>{v.motivo_cancelacion}
                                            </p>
                                        ) : null}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void verFactura(v)}
                                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
                                            >
                                                Ver factura
                                            </button>
                                            {!cancelada ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCancelarError('');
                                                        setVentaCancelar(v);
                                                    }}
                                                    className="rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-1.5 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/40"
                                                >
                                                    Cancelar venta
                                                </button>
                                            ) : null}
                                        </div>
                                    </li>
                                    );
                                })}
                            </ul>
                            {totalPaginas > 1 ? (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        disabled={pagina <= 1}
                                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-stone-500 tabular-nums">
                                        {pagina} / {totalPaginas}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={pagina >= totalPaginas}
                                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm disabled:opacity-40"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            ) : null}
                        </>
                    )}
                </section>
            </main>

            <ModalCancelarVenta
                open={Boolean(ventaCancelar)}
                venta={ventaCancelar}
                busy={cancelandoVenta}
                error={cancelarError}
                onClose={() => !cancelandoVenta && setVentaCancelar(null)}
                onConfirm={confirmarCancelarVenta}
            />
            <FacturaModal
                open={facturaModal}
                factura={facturaActiva}
                loading={loadingFactura}
                error={facturaError}
                onClose={() => setFacturaModal(false)}
            />
        </div>
    );
}
