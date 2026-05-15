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

const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const CATEGORIAS = ["arriendo", "servicios", "insumos", "otros"];

const CATEGORIA_LABELS = {
  arriendo: {
    label: "Arriendo",
    color: "bg-violet-900/60 text-violet-300 border-violet-700/50",
  },
  servicios: {
    label: "Servicios",
    color: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  },
  insumos: {
    label: "Insumos",
    color: "bg-amber-900/60 text-amber-300 border-amber-700/50",
  },
  otros: {
    label: "Otros",
    color: "bg-stone-800 text-stone-400 border-stone-700",
  },
};

const METODOS = ["EFECTIVO", "TARJETA", "NEQUI", "DAVIPLATA", "OTRO"];

const TABS = [
  { id: "gastos", label: "Gastos" },
  { id: "pyg", label: "P&G del período" },
];

// ── componentes base ────────────────────────────────────

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

function Btn({
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  children,
}) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-500 text-stone-950",
    secondary:
      "bg-stone-800 hover:bg-stone-700 text-stone-50 border border-stone-700",
    danger: "bg-red-700 hover:bg-red-600 text-stone-50",
    ghost: "text-stone-400 hover:text-stone-50 hover:bg-stone-800/60",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(base, sizes[size], variants[variant])}
    >
      {children}
    </button>
  );
}

function Label({ children }) {
  return (
    <label className="block text-xs font-medium text-stone-400 mb-1">
      {children}
    </label>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        {...props}
        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        {...props}
        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea
        {...props}
        rows={3}
        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
      {msg}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-700 border-t-amber-500" />
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
      {children}
    </th>
  );
}

function Td({ children, className }) {
  return (
    <td className={classNames("px-4 py-3 text-sm", className)}>{children}</td>
  );
}

function CategoriaBadge({ categoria }) {
  const info = CATEGORIA_LABELS[categoria] ?? {
    label: categoria,
    color: "bg-stone-800 text-stone-400 border-stone-700",
  };
  return (
    <span
      className={classNames(
        "text-xs font-semibold px-2 py-0.5 rounded-full border",
        info.color,
      )}
    >
      {info.label}
    </span>
  );
}

function KpiCard({ label, value, valueColor, hint, icon }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {label}
        </p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p
        className={classNames(
          "text-2xl font-semibold tabular-nums mt-2",
          valueColor ?? "text-stone-50",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
    </div>
  );
}

function MiniBar({ value, max, color = "bg-amber-500" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-stone-800 overflow-hidden mt-2">
      <div
        className={classNames(
          "h-full rounded-full transition-all duration-500",
          color,
        )}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ── Modal crear / editar gasto ──────────────────────────

function emptyDraft() {
  return {
    idGasto: null,
    categoria: "insumos",
    descripcion: "",
    valor: "",
    fecha: today(),
    metodo: "",
  };
}

function ModalGasto({ draft, setDraft, saving, error, onSave, onClose }) {
  const esNuevo = !draft.idGasto;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-stone-50 mb-5">
          {esNuevo ? "Registrar gasto" : "Editar gasto"}
        </h2>

        <div className="space-y-4">
          <Select
            label="Categoría"
            value={draft.categoria}
            onChange={(e) =>
              setDraft((d) => ({ ...d, categoria: e.target.value }))
            }
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABELS[c]?.label ?? c}
              </option>
            ))}
          </Select>

          <Textarea
            label="Descripción (opcional)"
            value={draft.descripcion}
            onChange={(e) =>
              setDraft((d) => ({ ...d, descripcion: e.target.value }))
            }
            placeholder="Detalle del gasto…"
          />

          <Input
            label="Valor (COP)"
            type="number"
            min="0.01"
            step="100"
            value={draft.valor}
            onChange={(e) => setDraft((d) => ({ ...d, valor: e.target.value }))}
            placeholder="Ej. 150000"
          />

          <Input
            label="Fecha"
            type="date"
            value={draft.fecha}
            onChange={(e) => setDraft((d) => ({ ...d, fecha: e.target.value }))}
          />

          <Select
            label="Método de pago (opcional)"
            value={draft.metodo}
            onChange={(e) =>
              setDraft((d) => ({ ...d, metodo: e.target.value }))
            }
          >
            <option value="">— Sin especificar —</option>
            {METODOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorMsg msg={error} />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Btn>
          <Btn onClick={onSave} disabled={saving}>
            {saving ? "Guardando…" : esNuevo ? "Registrar" : "Guardar cambios"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmar eliminación ─────────────────────────

function ModalConfirmar({ gasto, saving, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-stone-50 mb-2">
          ¿Eliminar gasto?
        </h2>
        <p className="text-sm text-stone-400 mb-1">
          <span className="text-stone-200 font-medium">
            {gasto.descripcion || "Sin descripción"}
          </span>
        </p>
        <p className="text-sm text-stone-400 mb-6">
          Valor:{" "}
          <span className="text-red-400 font-semibold">
            {formatCOP(gasto.valor)}
          </span>
          {" · "}
          {gasto.fecha?.slice(0, 10)}
        </p>
        <div className="flex justify-end gap-3">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={saving}>
            {saving ? "Eliminando…" : "Sí, eliminar"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Gastos (HU18) ──────────────────────────────────

function TabGastos() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [filtros, setFiltros] = useState({
    fecha_desde: firstOfMonth(),
    fecha_hasta: today(),
    categoria: "",
  });

  const [modalGasto, setModalGasto] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [modalElim, setModalElim] = useState(false);
  const [gastoElim, setGastoElim] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
      if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
      if (filtros.categoria) params.set("categoria", filtros.categoria);
      const res = await apiFetch(`${BASE}/admin/finanzas/gastos?${params}`);
      setData(res);
    } catch (err) {
      setError(err?.message || "No se pudo cargar los gastos.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirCrear() {
    setDraft(emptyDraft());
    setModalError("");
    setModalGasto(true);
  }

  function abrirEditar(g) {
    setDraft({
      idGasto: g.idGasto,
      categoria: g.categoria,
      descripcion: g.descripcion ?? "",
      valor: g.valor,
      fecha: g.fecha?.slice(0, 10) ?? today(),
      metodo: g.metodo ?? "",
    });
    setModalError("");
    setModalGasto(true);
  }

  function abrirEliminar(g) {
    setGastoElim(g);
    setModalElim(true);
  }

  async function guardar() {
    setSaving(true);
    setModalError("");
    try {
      const body = {
        categoria: draft.categoria,
        descripcion: draft.descripcion || null,
        valor: parseFloat(draft.valor),
        fecha: draft.fecha,
        metodo: draft.metodo || null,
      };
      if (draft.idGasto) {
        await apiFetch(`${BASE}/admin/finanzas/gastos/${draft.idGasto}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`${BASE}/admin/finanzas/gastos`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setModalGasto(false);
      cargar();
    } catch (err) {
      setModalError(err?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function eliminar() {
    setSaving(true);
    try {
      await apiFetch(`${BASE}/admin/finanzas/gastos/${gastoElim.idGasto}`, {
        method: "DELETE",
      });
      setModalElim(false);
      cargar();
    } catch (err) {
      setError(err?.message || "Error al eliminar.");
      setModalElim(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end justify-between mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label>Desde</Label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, fecha_desde: e.target.value }))
              }
              className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <Label>Hasta</Label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, fecha_hasta: e.target.value }))
              }
              className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <Label>Categoría</Label>
            <select
              value={filtros.categoria}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, categoria: e.target.value }))
              }
              className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABELS[c]?.label ?? c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Btn onClick={abrirCrear}>+ Registrar gasto</Btn>
      </div>

      {error && <ErrorMsg msg={error} />}

      {/* KPIs resumen */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <KpiCard
            label="Total gastos en período"
            value={formatCOP(data.suma_total)}
            hint={`${data.total_gastos} registro${data.total_gastos !== 1 ? "s" : ""}`}
            icon="💸"
          />
          <KpiCard
            label="Promedio por gasto"
            value={
              data.total_gastos > 0
                ? formatCOP(data.suma_total / data.total_gastos)
                : "—"
            }
            icon="📊"
          />
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="rounded-xl border border-stone-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-900">
              <tr>
                {[
                  "Fecha",
                  "Categoría",
                  "Descripción",
                  "Valor",
                  "Método",
                  "Registrado por",
                  "Acciones",
                ].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!data || data.data.length === 0) && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-stone-500"
                  >
                    Sin gastos para el filtro seleccionado.
                  </td>
                </tr>
              )}
              {data?.data.map((g) => (
                <tr
                  key={g.idGasto}
                  className="border-t border-stone-800 hover:bg-stone-800/30 transition-colors"
                >
                  <Td className="text-stone-400 whitespace-nowrap">
                    {g.fecha?.slice(0, 10)}
                  </Td>
                  <Td>
                    <CategoriaBadge categoria={g.categoria} />
                  </Td>
                  <Td className="text-stone-300 max-w-[200px] truncate">
                    {g.descripcion || (
                      <span className="text-stone-600 italic">
                        Sin descripción
                      </span>
                    )}
                  </Td>
                  <Td className="text-red-400 font-semibold tabular-nums">
                    {formatCOP(g.valor)}
                  </Td>
                  <Td className="text-stone-400">{g.metodo ?? "—"}</Td>
                  <Td className="text-stone-500">{g.registrado_por}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Btn
                        size="sm"
                        variant="secondary"
                        onClick={() => abrirEditar(g)}
                      >
                        Editar
                      </Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={() => abrirEliminar(g)}
                      >
                        Eliminar
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalGasto && (
        <ModalGasto
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          error={modalError}
          onSave={guardar}
          onClose={() => setModalGasto(false)}
        />
      )}
      {modalElim && gastoElim && (
        <ModalConfirmar
          gasto={gastoElim}
          saving={saving}
          onConfirm={eliminar}
          onClose={() => setModalElim(false)}
        />
      )}
    </>
  );
}

// ── Tab: P&G (HU19) ─────────────────────────────────────

function TabPyG() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [fechas, setFechas] = useState({
    desde: firstOfMonth(),
    hasta: today(),
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(
        `${BASE}/admin/finanzas/pyg?fecha_desde=${fechas.desde}&fecha_hasta=${fechas.hasta}`,
      );
      setData(res);
    } catch (err) {
      setError(err?.message || "No se pudo cargar el P&G.");
    } finally {
      setLoading(false);
    }
  }, [fechas]);

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line

  const utilidadPositiva = data ? data.utilidad_neta >= 0 : null;

  // Para la gráfica combinada, unir fechas únicas de ingresos y gastos
  const diasCombinados = data
    ? (() => {
        const map = {};
        (data.ingresos_por_dia ?? []).forEach((d) => {
          map[d.fecha] = {
            fecha: d.fecha,
            ingresos: Number(d.total_ingresos),
            gastos: 0,
          };
        });
        (data.gastos_por_dia ?? []).forEach((d) => {
          if (map[d.fecha]) map[d.fecha].gastos = Number(d.total_gastos);
          else
            map[d.fecha] = {
              fecha: d.fecha,
              ingresos: 0,
              gastos: Number(d.total_gastos),
            };
        });
        return Object.values(map).sort((a, b) =>
          a.fecha.localeCompare(b.fecha),
        );
      })()
    : [];

  const maxDia =
    diasCombinados.length > 0
      ? Math.max(...diasCombinados.map((d) => Math.max(d.ingresos, d.gastos)))
      : 0;

  const maxCategoria =
    data?.gastos_por_categoria?.length > 0
      ? Math.max(...data.gastos_por_categoria.map((c) => Number(c.total)))
      : 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label>Desde</Label>
          <input
            type="date"
            value={fechas.desde}
            onChange={(e) =>
              setFechas((f) => ({ ...f, desde: e.target.value }))
            }
            className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <input
            type="date"
            value={fechas.hasta}
            onChange={(e) =>
              setFechas((f) => ({ ...f, hasta: e.target.value }))
            }
            className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <Btn onClick={cargar} disabled={loading}>
          {loading ? "Cargando…" : "Generar P&G"}
        </Btn>
      </div>

      {error && <ErrorMsg msg={error} />}
      {loading && <Spinner />}

      {data && !loading && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Ingresos totales"
              value={formatCOP(data.total_ingresos)}
              valueColor="text-emerald-400"
              hint={`${fechas.desde} → ${fechas.hasta}`}
              icon="📈"
            />
            <KpiCard
              label="Gastos totales"
              value={formatCOP(data.total_gastos)}
              valueColor="text-red-400"
              icon="📉"
            />
            <div
              className={classNames(
                "border rounded-xl p-5 flex flex-col justify-between min-h-[110px]",
                utilidadPositiva
                  ? "bg-emerald-900/20 border-emerald-800/60"
                  : "bg-red-900/20 border-red-800/60",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Utilidad neta
                </p>
                <span className="text-lg">
                  {utilidadPositiva ? "✅" : "🔴"}
                </span>
              </div>
              <p
                className={classNames(
                  "text-2xl font-semibold tabular-nums mt-2",
                  utilidadPositiva ? "text-emerald-400" : "text-red-400",
                )}
              >
                {formatCOP(data.utilidad_neta)}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {utilidadPositiva ? "Ganancia" : "Pérdida"}
              </p>
            </div>
            <div
              className={classNames(
                "border rounded-xl p-5 flex flex-col justify-between min-h-[110px]",
                data.margen_pct != null && data.margen_pct >= 0
                  ? "bg-stone-900 border-stone-800"
                  : "bg-red-900/20 border-red-800/60",
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Margen neto
              </p>
              <p
                className={classNames(
                  "text-2xl font-semibold tabular-nums mt-2",
                  data.margen_pct == null
                    ? "text-stone-500"
                    : data.margen_pct >= 0
                      ? "text-emerald-400"
                      : "text-red-400",
                )}
              >
                {data.margen_pct != null ? `${data.margen_pct}%` : "—"}
              </p>
              <p className="text-xs text-stone-500 mt-1">sobre ingresos</p>
            </div>
          </div>

          {/* Gráfica combinada ingresos vs gastos por día */}
          {diasCombinados.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-4">
                Ingresos vs Gastos por día
              </p>
              <div className="flex gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-stone-400">Ingresos</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                  <span className="text-stone-400">Gastos</span>
                </span>
              </div>
              <div className="space-y-4">
                {diasCombinados.map((d) => (
                  <div key={d.fecha}>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>{d.fecha}</span>
                      <span
                        className={
                          d.ingresos >= d.gastos
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {d.ingresos >= d.gastos ? "+" : ""}
                        {formatCOP(d.ingresos - d.gastos)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {d.ingresos > 0 && (
                        <MiniBar
                          value={d.ingresos}
                          max={maxDia}
                          color="bg-emerald-500"
                        />
                      )}
                      {d.gastos > 0 && (
                        <MiniBar
                          value={d.gastos}
                          max={maxDia}
                          color="bg-red-500"
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      {d.ingresos > 0 ? (
                        <span className="text-emerald-500/70">
                          {formatCOP(d.ingresos)}
                        </span>
                      ) : (
                        <span />
                      )}
                      {d.gastos > 0 && (
                        <span className="text-red-500/70">
                          {formatCOP(d.gastos)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gastos por categoría */}
          {data.gastos_por_categoria?.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-4">
                Gastos por categoría
              </p>
              <div className="space-y-3">
                {data.gastos_por_categoria.map((c) => (
                  <div key={c.categoria}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CategoriaBadge categoria={c.categoria} />
                        <span className="text-xs text-stone-500">
                          {c.cantidad} registro{c.cantidad !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-red-400 tabular-nums">
                        {formatCOP(c.total)}
                      </span>
                    </div>
                    <MiniBar
                      value={Number(c.total)}
                      max={maxCategoria}
                      color="bg-red-500/60"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin datos */}
          {diasCombinados.length === 0 &&
            data.gastos_por_categoria?.length === 0 && (
              <div className="rounded-xl border border-stone-800 bg-stone-900 px-6 py-10 text-center">
                <p className="text-stone-500 text-sm">
                  Sin movimientos financieros en este período.
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────

export function AdminFinanzasPage() {
  const [tab, setTab] = useState("gastos");

  return (
    <AdminLayout title="Finanzas">
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-xl font-semibold text-stone-50">Finanzas</h1>
          <p className="text-sm text-stone-400 mt-1">HU18 · HU19</p>
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

        {tab === "gastos" && <TabGastos />}
        {tab === "pyg" && <TabPyG />}
      </div>
    </AdminLayout>
  );
}
