import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { apiFetch } from '../auth/apiClient';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAlertError } from '../utils/adminAlerts';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function formatCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatCompactCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(Math.round(n));
}

/** Colores para Recharts (API de la librería; paleta ámbar/naranja del proyecto) */
const CHART = {
    amber: '#d97706',
    amberLight: '#f59e0b',
    orange: '#c2410c',
    orangeHover: '#ea580c',
    muted: '#78716c',
    grid: '#292524',
    axis: '#a8a29e',
};

const PIE_COLORS = [CHART.amber, CHART.orange, CHART.amberLight, CHART.orangeHover, CHART.muted];

const ORDEN_ESTADO = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CERRADO', 'CANCELADO'];

function etiquetaEstadoPedido(estado) {
    const map = {
        PENDIENTE: 'Pendiente',
        EN_PREPARACION: 'En preparación',
        LISTO: 'Listo',
        ENTREGADO: 'Entregado',
        CERRADO: 'Cerrado',
        CANCELADO: 'Cancelado',
    };
    return map[estado] || estado;
}

function ordenarPorEstado(rows) {
    const m = new Map((rows || []).map((r) => [r.estado, r.total]));
    const out = [];
    for (const k of ORDEN_ESTADO) {
        if (m.has(k)) out.push({ estado: k, total: m.get(k), etiqueta: etiquetaEstadoPedido(k) });
    }
    for (const r of rows || []) {
        if (!ORDEN_ESTADO.includes(r.estado)) {
            out.push({ ...r, etiqueta: etiquetaEstadoPedido(r.estado) });
        }
    }
    return out;
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm shadow-xl">
            <div className="text-stone-400 text-xs mb-1">{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey || p.name} className="text-stone-50">
                    <span className="text-stone-400">{p.name}: </span>
                    {typeof p.value === 'number' && p.dataKey === 'ingresos' ? formatCOP(p.value) : p.value}
                </div>
            ))}
        </div>
    );
}

function KpiCard({ title, value, hint, accent }) {
    return (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 min-h-[112px] flex flex-col justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-stone-500">{title}</div>
            <div className={classNames('text-2xl font-semibold tabular-nums', accent || 'text-stone-50')}>{value}</div>
            {hint ? <div className="text-xs text-stone-500 mt-1">{hint}</div> : null}
        </div>
    );
}

function Panel({ title, subtitle, children, className }) {
    return (
        <div className={classNames('bg-stone-900 border border-stone-800 rounded-xl p-5', className)}>
            <div className="mb-4">
                <h2 className="text-base font-semibold text-stone-50">{title}</h2>
                {subtitle ? <p className="text-sm text-stone-400 mt-0.5">{subtitle}</p> : null}
            </div>
            {children}
        </div>
    );
}

export function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [payload, setPayload] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/admin/dashboard');
            setPayload(res?.data ?? null);
        } catch (e) {
            setPayload(null);
            void adminAlertError(e, 'No se pudo cargar el panel');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const resumen = payload?.resumen;
    const periodo = payload?.periodo;
    const topPlato = payload?.platillo_mas_vendido_mes;
    const topProductos = payload?.top_productos_mes || [];
    const pagos = payload?.pagos_por_metodo_mes || [];
    const serie = payload?.serie_ultimos_7_dias || [];
    const estados = useMemo(() => ordenarPorEstado(payload?.pedidos_por_estado), [payload?.pedidos_por_estado]);

    const pieData = useMemo(
        () => pagos.map((p) => ({ name: p.etiqueta, value: p.total })).filter((d) => d.value > 0),
        [pagos],
    );

    const barProductos = useMemo(
        () =>
            topProductos.map((p) => ({
                nombre: p.nombre?.length > 28 ? `${p.nombre.slice(0, 26)}…` : p.nombre,
                unidades: p.unidades_vendidas,
                ingreso: p.ingreso_cop,
            })),
        [topProductos],
    );

    const topProductsChartHeight = Math.max(280, Math.min(420, 48 + barProductos.length * 40));

    const utilidad = resumen?.utilidad_neta_mes_cop ?? 0;
    const utilidadClass = utilidad >= 0 ? 'text-stone-50' : 'text-orange-600';

    return (
        <AdminLayout title="Dashboard">
            <div className="space-y-6 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-stone-50">Resumen del negocio</h1>
                        <p className="text-sm text-stone-400 mt-1">
                            Datos en vivo según ventas registradas, pedidos y gastos. Mes:{' '}
                            <span className="text-stone-300 capitalize">{periodo?.mes_etiqueta ?? '—'}</span>.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="shrink-0 rounded-lg bg-orange-700 hover:bg-orange-600 disabled:opacity-60 text-stone-50 font-semibold text-sm px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                        {loading ? 'Actualizando…' : 'Actualizar'}
                    </button>
                </div>

                {loading && !payload ? (
                    <div className="rounded-xl border border-stone-800 bg-stone-900 p-10 text-center text-stone-400">
                        Cargando métricas…
                    </div>
                ) : null}

                {payload ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                title="Ingresos por ventas (mes)"
                                value={formatCOP(resumen?.ingresos_ventas_mes_cop)}
                                hint={`${resumen?.num_ventas_mes ?? 0} ventas · ticket medio ${formatCOP(resumen?.ticket_promedio_mes_cop)}`}
                            />
                            <KpiCard
                                title="Plato más vendido (mes)"
                                value={topPlato ? topPlato.nombre : 'Sin datos'}
                                hint={
                                    topPlato
                                        ? `${topPlato.unidades_vendidas} uds. · ${formatCOP(topPlato.ingreso_cop)}`
                                        : 'Aún no hay líneas de venta en el mes.'
                                }
                            />
                            <KpiCard
                                title="Pedidos creados (semana)"
                                value={String(resumen?.pedidos_creados_semana ?? 0)}
                                hint="Nuevas comandas abiertas en la semana actual."
                            />
                            <KpiCard
                                title="Utilidad neta (mes)"
                                value={formatCOP(resumen?.utilidad_neta_mes_cop)}
                                hint={`Gastos del mes: ${formatCOP(resumen?.gastos_mes_cop)}`}
                                accent={utilidadClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                title="Pedidos activos (salón)"
                                value={String(resumen?.pedidos_activos_salon ?? 0)}
                                hint="Pendiente, en preparación o listo."
                            />
                            <KpiCard
                                title="En cola de cocina"
                                value={String(resumen?.pedidos_en_cocina ?? 0)}
                                hint="Pendiente o en preparación."
                            />
                            <KpiCard
                                title="Mesas ocupadas"
                                value={`${resumen?.mesas_ocupadas ?? 0} / ${resumen?.mesas_activas ?? 0}`}
                                hint="Mesas activas del salón."
                            />
                            <KpiCard
                                title="Última actualización"
                                value={
                                    payload.generado_en
                                        ? new Date(payload.generado_en).toLocaleString('es-CO', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              day: 'numeric',
                                              month: 'short',
                                          })
                                        : '—'
                                }
                                hint="Zona horaria del servidor."
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <Panel
                                title="Actividad últimos 7 días"
                                subtitle="Pedidos nuevos por día e ingresos por ventas registradas ese día."
                            >
                                <div className="h-[300px] w-full min-w-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="etiqueta" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} />
                                            <YAxis
                                                yAxisId="left"
                                                tick={{ fill: CHART.axis, fontSize: 11 }}
                                                axisLine={{ stroke: CHART.grid }}
                                                allowDecimals={false}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                tick={{ fill: CHART.axis, fontSize: 11 }}
                                                axisLine={{ stroke: CHART.grid }}
                                                tickFormatter={(v) => formatCompactCOP(v)}
                                            />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Legend wrapperStyle={{ color: CHART.axis, fontSize: 12 }} />
                                            <Bar yAxisId="left" dataKey="pedidos" name="Pedidos" fill={CHART.amber} radius={[4, 4, 0, 0]} />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="ingresos"
                                                name="Ingresos"
                                                stroke={CHART.orange}
                                                strokeWidth={2}
                                                dot={{ fill: CHART.orange, r: 3 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Panel>

                            <Panel title="Pagos del mes" subtitle="Distribución por método (ventas del mes actual).">
                                {pieData.length === 0 ? (
                                    <p className="text-sm text-stone-500 py-12 text-center">No hay pagos registrados en este mes.</p>
                                ) : (
                                    <div className="h-[300px] w-full min-w-0 flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={56}
                                                    outerRadius={96}
                                                    paddingAngle={2}
                                                >
                                                    {pieData.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(v) => formatCOP(v)}
                                                    contentStyle={{
                                                        backgroundColor: '#1c1917',
                                                        border: '1px solid #292524',
                                                        borderRadius: '8px',
                                                        color: '#fafaf9',
                                                    }}
                                                />
                                                <Legend wrapperStyle={{ color: CHART.axis, fontSize: 12 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Panel>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <Panel title="Top productos del mes" subtitle="Unidades vendidas en ventas del mes (ranking).">
                                {barProductos.length === 0 ? (
                                    <p className="text-sm text-stone-500 py-12 text-center">Sin ventas con detalle en el mes.</p>
                                ) : (
                                    <div className="w-full min-w-0 min-h-[280px]" style={{ height: topProductsChartHeight }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barProductos} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                                                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} allowDecimals={false} />
                                                <YAxis type="category" dataKey="nombre" width={120} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar dataKey="unidades" name="Unidades" fill={CHART.amberLight} radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Panel>

                            <Panel title="Pedidos por estado" subtitle="Inventario actual de comandas en el sistema.">
                                {estados.length === 0 ? (
                                    <p className="text-sm text-stone-500 py-12 text-center">No hay pedidos registrados.</p>
                                ) : (
                                    <div className="h-[300px] w-full min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={estados} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                                                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="etiqueta" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} interval={0} angle={-18} textAnchor="end" height={56} />
                                                <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} allowDecimals={false} />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar dataKey="total" name="Pedidos" fill={CHART.orange} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Panel>
                        </div>
                    </>
                ) : null}
            </div>
        </AdminLayout>
    );
}
