import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';
import { confirmStaffLogout } from '../utils/confirmLogout';
import { FacturaModal, imprimirFactura } from '../components/FacturaModal';

const METODOS_PAGO = [
    { value: '', label: 'Todos' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'DAVIPLATA', label: 'Daviplata' },
];

const PAGE_SIZE = 10;

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

export function CajeroFacturasPage() {
    const [facturas, setFacturas] = useState([]);
    const [resumen, setResumen] = useState({ total_periodo: 0, num_ventas: 0, num_canceladas: 0 });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [desde, setDesde] = useState(hoyLocal);
    const [hasta, setHasta] = useState(hoyLocal);
    const [horaDesde, setHoraDesde] = useState('');
    const [horaHasta, setHoraHasta] = useState('');
    const [nombre, setNombre] = useState('');
    const [producto, setProducto] = useState('');
    const [numero, setNumero] = useState('');
    const [metodo, setMetodo] = useState('');
    const [pagina, setPagina] = useState(1);

    const [facturaActiva, setFacturaActiva] = useState(null);
    const [facturaModal, setFacturaModal] = useState(false);
    const [loadingFactura, setLoadingFactura] = useState(false);
    const [facturaError, setFacturaError] = useState('');

    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(facturas.length / PAGE_SIZE)), [facturas.length]);

    const facturasPagina = useMemo(() => {
        const start = (pagina - 1) * PAGE_SIZE;
        return facturas.slice(start, start + PAGE_SIZE);
    }, [facturas, pagina]);

    const loadFacturas = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (desde) params.set('desde', desde);
            if (hasta) params.set('hasta', hasta);
            if (horaDesde) params.set('hora_desde', horaDesde);
            if (horaHasta) params.set('hora_hasta', horaHasta);
            if (nombre.trim()) params.set('nombre', nombre.trim());
            if (producto.trim()) params.set('producto', producto.trim());
            if (numero.trim()) params.set('numero', numero.trim());
            if (metodo) params.set('metodo', metodo);
            const res = await apiFetch(`/api/cajero/ventas?${params}`);
            setFacturas(Array.isArray(res?.data) ? res.data : []);
            setResumen({
                total_periodo: res?.total_periodo ?? 0,
                num_ventas: res?.num_ventas ?? 0,
                num_canceladas: res?.num_canceladas ?? 0,
            });
        } catch (e) {
            setFacturas([]);
            setError(e?.message || 'No se pudieron cargar las facturas.');
        } finally {
            setLoading(false);
        }
    }, [desde, hasta, horaDesde, horaHasta, nombre, producto, numero, metodo]);

    useEffect(() => {
        void loadFacturas();
    }, [loadFacturas]);

    useEffect(() => {
        setPagina(1);
    }, [desde, hasta, horaDesde, horaHasta, nombre, producto, numero, metodo]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    const fetchFactura = useCallback(async (idVenta) => {
        const res = await apiFetch(`/api/cajero/ventas/${idVenta}/factura`);
        return res?.data ?? null;
    }, []);

    async function verFactura(venta) {
        setFacturaModal(true);
        setFacturaActiva(null);
        setFacturaError('');
        setLoadingFactura(true);
        try {
            setFacturaActiva(await fetchFactura(venta.idVenta));
        } catch (e) {
            setFacturaError(e?.message || 'No se pudo cargar la factura.');
        } finally {
            setLoadingFactura(false);
        }
    }

    async function imprimirDirecto(venta) {
        try {
            const f = await fetchFactura(venta.idVenta);
            if (f) imprimirFactura(f);
        } catch {
            void verFactura(venta);
        }
    }

    function limpiarFiltros() {
        const hoy = hoyLocal();
        setDesde(hoy);
        setHasta(hoy);
        setHoraDesde('');
        setHoraHasta('');
        setNombre('');
        setProducto('');
        setNumero('');
        setMetodo('');
        setPagina(1);
    }

    function onSalir() {
        clearToken();
        window.location.href = '/staff?rol=cajero';
    }

    async function solicitarSalir() {
        const ok = await confirmStaffLogout();
        if (ok) onSalir();
    }

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
                            <h1 className="text-lg sm:text-xl font-semibold truncate">Facturas</h1>
                            <p className="text-xs text-stone-600 dark:text-stone-400">Historial de cobros emitidos</p>
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

            <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
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
                            <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Hora desde</span>
                            <input
                                type="time"
                                value={horaDesde}
                                onChange={(e) => setHoraDesde(e.target.value)}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="text-sm">
                            <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">Hora hasta</span>
                            <input
                                type="time"
                                value={horaHasta}
                                onChange={(e) => setHoraHasta(e.target.value)}
                                className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm"
                            />
                        </label>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="text-sm">
                            <span className="block text-stone-600 dark:text-stone-400 mb-1 text-xs">N.º factura</span>
                            <input
                                type="text"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                placeholder="FAC-000001"
                                className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm w-36"
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
                            onClick={limpiarFiltros}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-xs text-stone-600 dark:text-stone-400"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
                    <div>
                        <div className="text-xs text-stone-500 uppercase tracking-wide">Total facturado</div>
                        <div className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                            {formatMoney(resumen.total_periodo)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-stone-500 uppercase tracking-wide">Facturas</div>
                        <div className="text-2xl font-bold tabular-nums">{resumen.num_ventas}</div>
                    </div>
                    {resumen.num_canceladas > 0 ? (
                        <div>
                            <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Anuladas</div>
                            <div className="text-2xl font-bold tabular-nums text-red-700 dark:text-red-300">
                                {resumen.num_canceladas}
                            </div>
                        </div>
                    ) : null}
                </div>

                {error ? (
                    <p className="text-sm text-red-700 dark:text-red-300 rounded-xl border border-red-300/50 px-3 py-2">{error}</p>
                ) : null}

                {loading ? (
                    <p className="text-sm text-stone-500 py-8 text-center">Cargando facturas…</p>
                ) : facturas.length === 0 ? (
                    <p className="text-sm text-stone-600 dark:text-stone-400 py-8 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                        No hay facturas con estos filtros.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-stone-600 dark:text-stone-400 tabular-nums">
                            {facturas.length} factura{facturas.length !== 1 ? 's' : ''}
                            {facturas.length > PAGE_SIZE ? ` · página ${pagina} de ${totalPaginas}` : ''}
                        </p>
                        <ul className="space-y-3">
                            {facturasPagina.map((v) => {
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
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-stone-900 dark:text-stone-50 tabular-nums">
                                                        {v.numero_factura || `Venta #${v.idVenta}`}
                                                    </span>
                                                    <span
                                                        className={classNames(
                                                            'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border',
                                                            cancelada
                                                                ? 'border-red-400/50 text-red-800 dark:text-red-200'
                                                                : 'border-emerald-400/50 text-emerald-800 dark:text-emerald-200',
                                                        )}
                                                    >
                                                        {cancelada ? 'Anulada' : 'Emitida'}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-stone-500">
                                                    {formatMesa(v.pedido?.mesa)} · Pedido #{v.pedido?.idPedido}
                                                </div>
                                                {v.pedido?.mesero ? (
                                                    <div className="text-xs text-stone-500">
                                                        Mesero: {v.pedido.mesero.nombre} {v.pedido.mesero.apellido}
                                                    </div>
                                                ) : null}
                                                <div className="mt-0.5 text-xs text-stone-500">{formatFechaHora(v.registrada_en)}</div>
                                            </div>
                                            <div
                                                className={classNames(
                                                    'font-bold tabular-nums',
                                                    cancelada ? 'text-stone-500 line-through' : 'text-blue-700 dark:text-blue-300',
                                                )}
                                            >
                                                {formatMoney(v.total)}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void verFactura(v)}
                                                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
                                            >
                                                Ver factura
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void imprimirDirecto(v)}
                                                className="rounded-lg border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1.5 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                            >
                                                Imprimir
                                            </button>
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
            </main>

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
