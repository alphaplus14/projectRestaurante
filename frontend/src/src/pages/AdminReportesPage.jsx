import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../auth/apiClient";
import { AdminLayout } from "../layouts/AdminLayout";

const BASE = "http://127.0.0.1:8000/api";

// ── helpers ────────────────────────────────────────────
function formatCOP(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { id: "hoy", label: "Ventas del día" },
  { id: "rango", label: "Por rango de fechas" },
  { id: "ranking", label: "Productos más vendidos" },
];

// ── componentes reutilizables ──────────────────────────

function KpiCard({ label, value, hint }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 flex flex-col justify-between min-h-[100px]">
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </div>
      <div className="text-2xl font-semibold text-stone-50 tabular-nums mt-2">
        {value}
      </div>
      {hint && <div className="text-xs text-stone-500 mt-1">{hint}</div>}
    </div>
  );
}

function MiniBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-stone-800 overflow-hidden mt-2">
      <div
        className="h-full rounded-full bg-amber-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        active
          ? "bg-orange-700 text-stone-50"
          : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-50",
      )}
    >
      {children}
    </button>
  );
}

function ActionButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-orange-700 hover:bg-orange-600 disabled:opacity-60 text-stone-50 font-semibold text-sm px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      {children}
    </button>
  );
}

function InputField({ label, type, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return <p className="text-sm text-red-500 mt-2">{msg}</p>;
}

function TableWrapper({ children }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left text-xs font-semibold uppercase tracking-wide text-stone-500 px-4 py-3 bg-stone-950">
      {children}
    </th>
  );
}

function Td({ children, className }) {
  return (
    <td className={classNames("px-4 py-3 text-sm text-stone-300", className)}>
      {children}
    </td>
  );
}

// ── HU13: Ventas del día ───────────────────────────────

function VentasHoy() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    hora_desde: "",
    hora_hasta: "",
    metodo: "",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.hora_desde) params.set("hora_desde", filtros.hora_desde);
      if (filtros.hora_hasta) params.set("hora_hasta", filtros.hora_hasta);
      if (filtros.metodo) params.set("metodo", filtros.metodo);
      const res = await apiFetch(`${BASE}/admin/reportes/ventas-hoy?${params}`);
      setData(res);
    } catch {
      setError("No se pudo cargar el reporte.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <InputField
          label="Hora desde"
          type="time"
          value={filtros.hora_desde}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, hora_desde: e.target.value }))
          }
        />
        <InputField
          label="Hora hasta"
          type="time"
          value={filtros.hora_hasta}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, hora_hasta: e.target.value }))
          }
        />
        <SelectField
          label="Método de pago"
          value={filtros.metodo}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, metodo: e.target.value }))
          }
          options={[
            { value: "", label: "Todos" },
            { value: "EFECTIVO", label: "Efectivo" },
            { value: "TARJETA", label: "Tarjeta" },
            { value: "NEQUI", label: "Nequi" },
            { value: "DAVIPLATA", label: "Daviplata" },
          ]}
        />
        <ActionButton onClick={cargar} disabled={loading}>
          {loading ? "Cargando…" : "Filtrar"}
        </ActionButton>
      </div>

      {error && <ErrorMsg msg={error} />}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Total del día"
              value={formatCOP(data.total_dia)}
              hint={data.fecha}
            />
            <KpiCard label="Ventas cerradas" value={data.num_ventas} />
            <KpiCard label="Fecha" value={data.fecha} />
          </div>

          <TableWrapper>
            <thead>
              <tr>
                {["# Venta", "Mesa", "Total", "Método(s)", "Hora"].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-stone-500"
                  >
                    Sin ventas para este filtro
                  </td>
                </tr>
              )}
              {data.data.map((v) => (
                <tr
                  key={v.idVenta}
                  className="border-t border-stone-800 hover:bg-stone-800/30 transition-colors"
                >
                  <Td className="text-stone-400">#{v.idVenta}</Td>
                  <Td>
                    Mesa {v.mesa_numero}
                    {v.mesa_nombre ? ` — ${v.mesa_nombre}` : ""}
                  </Td>
                  <Td className="text-amber-400 font-semibold">
                    {formatCOP(v.total)}
                  </Td>
                  <Td>{v.metodos_pago ?? "—"}</Td>
                  <Td className="text-stone-500">
                    {v.registrada_en?.slice(11, 16)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </>
      )}
    </div>
  );
}

// ── HU14: Ventas por rango ─────────────────────────────

function VentasPorRango() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fechas, setFechas] = useState({ desde: today(), hasta: today() });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `${BASE}/admin/reportes/ventas?fecha_desde=${fechas.desde}&fecha_hasta=${fechas.hasta}`,
      );
      setData(res);
    } catch {
      setError("No se pudo cargar el reporte.");
    } finally {
      setLoading(false);
    }
  }, [fechas]);

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line

  const maxDia = data
    ? Math.max(...(data.por_dia?.map((d) => Number(d.total_dia)) ?? [0]))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <InputField
          label="Fecha desde"
          type="date"
          value={fechas.desde}
          onChange={(e) => setFechas((f) => ({ ...f, desde: e.target.value }))}
        />
        <InputField
          label="Fecha hasta"
          type="date"
          value={fechas.hasta}
          onChange={(e) => setFechas((f) => ({ ...f, hasta: e.target.value }))}
        />
        <ActionButton onClick={cargar} disabled={loading}>
          {loading ? "Cargando…" : "Generar reporte"}
        </ActionButton>
      </div>

      {error && <ErrorMsg msg={error} />}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Total ventas"
              value={formatCOP(data.total_ventas)}
            />
            <KpiCard label="Núm. pedidos" value={data.num_pedidos} />
            <KpiCard
              label="Promedio/pedido"
              value={formatCOP(data.promedio_pedido)}
            />
          </div>

          {data.por_dia?.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-4">
                Ventas por día
              </p>
              <div className="space-y-3">
                {data.por_dia.map((d) => (
                  <div key={d.fecha}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-400">{d.fecha}</span>
                      <span className="text-amber-400 font-semibold">
                        {formatCOP(d.total_dia)}
                      </span>
                    </div>
                    <MiniBar value={Number(d.total_dia)} max={maxDia} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <TableWrapper>
            <thead>
              <tr>
                {["# Venta", "Fecha", "Mesa", "Total", "Métodos"].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-stone-500"
                  >
                    Sin ventas en este rango
                  </td>
                </tr>
              )}
              {data.data.map((v) => (
                <tr
                  key={v.idVenta}
                  className="border-t border-stone-800 hover:bg-stone-800/30 transition-colors"
                >
                  <Td className="text-stone-400">#{v.idVenta}</Td>
                  <Td className="text-stone-500">
                    {v.registrada_en?.slice(0, 16).replace("T", " ")}
                  </Td>
                  <Td>Mesa {v.mesa_numero}</Td>
                  <Td className="text-amber-400 font-semibold">
                    {formatCOP(v.total)}
                  </Td>
                  <Td>{v.metodos_pago ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </>
      )}
    </div>
  );
}

// ── HU15: Ranking productos ────────────────────────────

function RankingProductos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fechas, setFechas] = useState({ desde: "", hasta: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fechas.desde) params.set("fecha_desde", fechas.desde);
      if (fechas.hasta) params.set("fecha_hasta", fechas.hasta);
      const res = await apiFetch(
        `${BASE}/admin/reportes/productos-mas-vendidos?${params}`,
      );
      setData(res);
    } catch {
      setError("No se pudo cargar el ranking.");
    } finally {
      setLoading(false);
    }
  }, [fechas]);

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line

  const maxVendido = data
    ? Math.max(...(data.data?.map((p) => Number(p.total_vendido)) ?? [0]))
    : 0;

  const medalClass = (i) => {
    if (i === 0) return "bg-amber-500 text-stone-900";
    if (i === 1) return "bg-stone-400 text-stone-900";
    if (i === 2) return "bg-orange-700 text-stone-50";
    return "bg-stone-800 text-stone-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <InputField
          label="Desde (opcional)"
          type="date"
          value={fechas.desde}
          onChange={(e) => setFechas((f) => ({ ...f, desde: e.target.value }))}
        />
        <InputField
          label="Hasta (opcional)"
          type="date"
          value={fechas.hasta}
          onChange={(e) => setFechas((f) => ({ ...f, hasta: e.target.value }))}
        />
        <ActionButton onClick={cargar} disabled={loading}>
          {loading ? "Cargando…" : "Ver ranking"}
        </ActionButton>
      </div>

      {error && <ErrorMsg msg={error} />}

      {data && (
        <div className="space-y-3">
          {data.data.length === 0 && (
            <p className="text-sm text-stone-500">
              Sin datos para el período seleccionado.
            </p>
          )}
          {data.data.map((p, i) => (
            <div
              key={p.idProducto}
              className={classNames(
                "bg-stone-900 border rounded-xl p-4",
                i === 0 ? "border-amber-500/50" : "border-stone-800",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={classNames(
                      "text-xs font-bold rounded-md px-2 py-0.5 min-w-[32px] text-center",
                      medalClass(i),
                    )}
                  >
                    #{i + 1}
                  </span>
                  <span className="text-sm font-semibold text-stone-50">
                    {p.nombreProducto}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-400">
                    {formatCOP(p.ingreso_total)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {p.total_vendido} unidades
                  </p>
                </div>
              </div>
              <MiniBar value={Number(p.total_vendido)} max={maxVendido} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────

export function AdminReportesPage() {
  const [tab, setTab] = useState("hoy");

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-semibold text-stone-50">
            Reportes de ventas
          </h1>
          <p className="text-sm text-stone-400 mt-1">HU13 · HU14 · HU15</p>
        </div>

        <div className="flex gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <TabButton
              key={t.id}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </TabButton>
          ))}
        </div>

        {tab === "hoy" && <VentasHoy />}
        {tab === "rango" && <VentasPorRango />}
        {tab === "ranking" && <RankingProductos />}
      </div>
    </AdminLayout>
  );
}
