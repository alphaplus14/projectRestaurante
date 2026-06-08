import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../auth/apiClient";
import { AdminLayout } from "../layouts/AdminLayout";
import { adminAlertError } from "../utils/adminAlerts";

const API_BASE = "/api";

// ── helpers ────────────────────────────────────────────
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const UNIDADES = ["g", "kg", "ml", "L", "unidad", "porción", "lb", "oz"];

const TABS = [
  { id: "stock", label: "Stock general" },
  { id: "alertas", label: "Alertas" },
  { id: "historial", label: "Historial" },
];

const fieldClass =
  "rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

const panelClass =
  "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl";

// ── componentes base ────────────────────────────────────

function TabButton({ active, onClick, children, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 flex items-center gap-2",
        active
          ? "bg-orange-700 text-stone-50"
          : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-50",
      )}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="bg-red-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badge}
        </span>
      )}
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
      "bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-stone-700",
    danger: "bg-red-700 hover:bg-red-600 text-stone-50",
    ghost:
      "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-200 dark:hover:bg-stone-800/60",
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
    <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
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
        className={classNames("w-full", fieldClass)}
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
        className={classNames("w-full", fieldClass)}
      >
        {children}
      </select>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-stone-700 border-t-amber-500" />
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
      {children}
    </th>
  );
}

function Td({ children, className }) {
  return (
    <td className={classNames("px-4 py-3 text-sm", className)}>{children}</td>
  );
}

// Barra de stock visual
function StockBar({ stock, stockMinimo }) {
  const pct =
    stockMinimo > 0 ? Math.min((stock / stockMinimo) * 100, 400) : 100;
  const color =
    stock <= stockMinimo
      ? "bg-red-500"
      : stock <= stockMinimo * 2
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mt-1">
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

function AlertaBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-900/60 border border-red-700/60 px-2 py-0.5 text-xs font-semibold text-red-300">
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      </svg>
      Stock bajo
    </span>
  );
}

// ── Modal crear/editar ingrediente ─────────────────────

function emptyDraft() {
  return {
    idIngrediente: null,
    nombreIngrediente: "",
    unidad: "g",
    stock: "",
    stock_minimo: "",
  };
}

function ModalIngrediente({ draft, setDraft, saving, onSave, onClose }) {
  const esNuevo = !draft.idIngrediente;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 mb-5">
          {esNuevo ? "Registrar ingrediente" : "Editar ingrediente"}
        </h2>

        <div className="space-y-4">
          <Input
            label="Nombre del ingrediente"
            value={draft.nombreIngrediente}
            onChange={(e) =>
              setDraft((d) => ({ ...d, nombreIngrediente: e.target.value }))
            }
            placeholder="Ej. Arroz, Pollo, Aceite…"
          />
          <Select
            label="Unidad de medida"
            value={draft.unidad}
            onChange={(e) =>
              setDraft((d) => ({ ...d, unidad: e.target.value }))
            }
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
          {esNuevo && (
            <Input
              label="Stock inicial"
              type="number"
              min="0"
              step="0.01"
              value={draft.stock}
              onChange={(e) =>
                setDraft((d) => ({ ...d, stock: e.target.value }))
              }
              placeholder="0"
            />
          )}
          <Input
            label="Stock mínimo (alerta)"
            type="number"
            min="0"
            step="0.01"
            value={draft.stock_minimo}
            onChange={(e) =>
              setDraft((d) => ({ ...d, stock_minimo: e.target.value }))
            }
            placeholder="Ej. 500"
          />
        </div>

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

// ── Modal movimiento de stock ───────────────────────────

function emptyMovimiento() {
  return { tipo: "ENTRADA", cantidad: "", motivo: "", referencia: "" };
}

function ModalMovimiento({
  ingrediente,
  mov,
  setMov,
  saving,
  onSave,
  onClose,
}) {
  const tipoLabels = {
    ENTRADA: {
      label: "Entrada",
      hint: "Se suma al stock actual",
      color: "text-emerald-400",
    },
    SALIDA: {
      label: "Salida",
      hint: "Se resta del stock actual",
      color: "text-red-400",
    },
    AJUSTE: {
      label: "Ajuste",
      hint: "El nuevo stock será exactamente esta cantidad",
      color: "text-amber-400",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 mb-1">
          Registrar movimiento
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">
          {ingrediente.nombreIngrediente} —{" "}
          <span className="text-stone-700 dark:text-stone-300 font-medium">
            Stock actual: {ingrediente.stock} {ingrediente.unidad}
          </span>
        </p>

        <div className="space-y-4">
          {/* Selector tipo con tarjetas */}
          <div>
            <Label>Tipo de movimiento</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(tipoLabels).map(([tipo, info]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setMov((m) => ({ ...m, tipo }))}
                  className={classNames(
                    "rounded-lg border p-2.5 text-center text-xs font-semibold transition-colors",
                    mov.tipo === tipo
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600",
                  )}
                >
                  {info.label}
                </button>
              ))}
            </div>
            <p
              className={classNames(
                "text-xs mt-1.5",
                tipoLabels[mov.tipo].color,
              )}
            >
              {tipoLabels[mov.tipo].hint}
            </p>
          </div>

          <Input
            label={mov.tipo === "AJUSTE" ? "Nuevo stock" : "Cantidad"}
            type="number"
            min="0.0001"
            step="0.01"
            value={mov.cantidad}
            onChange={(e) =>
              setMov((m) => ({ ...m, cantidad: e.target.value }))
            }
            placeholder={`en ${ingrediente.unidad}`}
          />
          <Input
            label="Motivo"
            value={mov.motivo}
            onChange={(e) => setMov((m) => ({ ...m, motivo: e.target.value }))}
            placeholder="Ej. Compra de insumos, merma, conteo físico…"
          />
          <Input
            label="Referencia (opcional)"
            value={mov.referencia}
            onChange={(e) =>
              setMov((m) => ({ ...m, referencia: e.target.value }))
            }
            placeholder="Ej. Factura #001, Pedido #12…"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Btn>
          <Btn onClick={onSave} disabled={saving}>
            {saving ? "Registrando…" : "Registrar movimiento"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Modal historial de movimientos ─────────────────────

function ModalHistorial({ ingrediente, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch(
      `${API_BASE}/admin/inventario/ingredientes/${ingrediente.idIngrediente}/movimientos`,
    )
      .then(setData)
      .catch((err) => {
        void adminAlertError(err, "Historial de movimientos");
      })
      .finally(() => setLoading(false));
  }, [ingrediente.idIngrediente]);

  const tipoBadge = (tipo) => {
    if (tipo === "ENTRADA")
      return "bg-emerald-900/60 text-emerald-300 border-emerald-700/50";
    if (tipo === "SALIDA")
      return "bg-red-900/60 text-red-300 border-red-700/50";
    return "bg-amber-900/60 text-amber-300 border-amber-700/50";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
              Historial de movimientos
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {ingrediente.nombreIngrediente}
            </p>
          </div>
          <Btn variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Btn>
        </div>

        {loading && <Spinner />}

        {data && (
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {data.data.length === 0 ? (
              <p className="text-sm text-stone-600 dark:text-stone-500 py-8 text-center">
                Sin movimientos registrados.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {["Fecha", "Tipo", "Cantidad", "Motivo", "Usuario"].map(
                      (h) => (
                        <Th key={h}>{h}</Th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((m) => (
                    <tr
                      key={m.idMovimiento}
                      className="border-t border-stone-200 dark:border-stone-800 hover:bg-stone-100/80 dark:hover:bg-stone-800/30"
                    >
                      <Td className="text-stone-600 dark:text-stone-500 whitespace-nowrap">
                        {m.fecha?.slice(0, 16).replace("T", " ")}
                      </Td>
                      <Td>
                        <span
                          className={classNames(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            tipoBadge(m.tipo),
                          )}
                        >
                          {m.tipo}
                        </span>
                      </Td>
                      <Td className="text-stone-900 dark:text-stone-50 font-medium tabular-nums">
                        {m.tipo === "SALIDA" ? "-" : "+"}
                        {m.cantidad} {ingrediente.unidad}
                      </Td>
                      <Td className="text-stone-700 dark:text-stone-300">
                        {m.motivo}
                      </Td>
                      <Td className="text-stone-600 dark:text-stone-500">
                        <div>{m.usuario}</div>
                        {m.usuario_rol ? (
                          <div className="text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-500 mt-0.5">
                            {m.usuario_rol}
                          </div>
                        ) : null}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Stock general (HU16) ───────────────────────────

function StockGeneral({ data, onRecargar }) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal crear/editar
  const [modalIngr, setModalIngr] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  // Modal movimiento
  const [modalMov, setModalMov] = useState(false);
  const [movDraft, setMovDraft] = useState(emptyMovimiento());
  const [ingredSelec, setIngredSelec] = useState(null);

  // Modal historial
  const [modalHist, setModalHist] = useState(false);

  const filtrados = (data?.data ?? []).filter((i) =>
    i.nombreIngrediente.toLowerCase().includes(search.toLowerCase()),
  );

  function abrirCrear() {
    setDraft(emptyDraft());
    setModalIngr(true);
  }

  function abrirEditar(ing) {
    setDraft({
      idIngrediente: ing.idIngrediente,
      nombreIngrediente: ing.nombreIngrediente,
      unidad: ing.unidad,
      stock: ing.stock,
      stock_minimo: ing.stock_minimo,
    });
    setModalIngr(true);
  }

  function abrirMovimiento(ing) {
    setIngredSelec(ing);
    setMovDraft(emptyMovimiento());
    setModalMov(true);
  }

  function abrirHistorial(ing) {
    setIngredSelec(ing);
    setModalHist(true);
  }

  async function guardarIngrediente() {
    setSaving(true);
    try {
      if (draft.idIngrediente) {
        await apiFetch(
          `${API_BASE}/admin/inventario/ingredientes/${draft.idIngrediente}`,
          {
            method: "PUT",
            body: JSON.stringify({
              nombreIngrediente: draft.nombreIngrediente,
              unidad: draft.unidad,
              stock_minimo: parseFloat(draft.stock_minimo) || 0,
            }),
          },
        );
      } else {
        await apiFetch(`${API_BASE}/admin/inventario/ingredientes`, {
          method: "POST",
          body: JSON.stringify({
            nombreIngrediente: draft.nombreIngrediente,
            unidad: draft.unidad,
            stock: parseFloat(draft.stock) || 0,
            stock_minimo: parseFloat(draft.stock_minimo) || 0,
          }),
        });
      }
      setModalIngr(false);
      onRecargar();
    } catch (err) {
      void adminAlertError(err, "Ingrediente");
    } finally {
      setSaving(false);
    }
  }

  async function guardarMovimiento() {
    setSaving(true);
    try {
      await apiFetch(
        `${API_BASE}/admin/inventario/ingredientes/${ingredSelec.idIngrediente}/movimiento`,
        {
          method: "POST",
          body: JSON.stringify({
            tipo: movDraft.tipo,
            cantidad: parseFloat(movDraft.cantidad),
            motivo: movDraft.motivo,
            referencia: movDraft.referencia || null,
          }),
        },
      );
      setModalMov(false);
      onRecargar();
    } catch (err) {
      void adminAlertError(err, "Movimiento de stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={classNames(panelClass, "p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-500">
            Total ingredientes
          </p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mt-2">
            {data?.total ?? "—"}
          </p>
        </div>
        <div className={classNames(panelClass, "p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-500">
            Con stock normal
          </p>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            {(data?.total ?? 0) - (data?.total_bajo_stock ?? 0)}
          </p>
        </div>
        <div
          className={classNames(
            "border rounded-xl p-5",
            (data?.total_bajo_stock ?? 0) > 0
              ? "bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-800/60"
              : panelClass,
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-500">
            Alertas de stock
          </p>
          <p
            className={classNames(
              "text-2xl font-semibold mt-2",
              (data?.total_bajo_stock ?? 0) > 0
                ? "text-red-600 dark:text-red-400"
                : "text-stone-900 dark:text-stone-50",
            )}
          >
            {data?.total_bajo_stock ?? "—"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <input
          type="search"
          placeholder="Buscar ingrediente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={classNames(fieldClass, "w-64")}
        />
        <Btn onClick={abrirCrear}>+ Registrar ingrediente</Btn>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900">
        <table className="w-full">
          <thead className="bg-stone-100 dark:bg-stone-950/50">
            <tr>
              {[
                "Ingrediente",
                "Unidad",
                "Stock actual",
                "Stock mínimo",
                "Estado",
                "Acciones",
              ].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {filtrados.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-stone-600 dark:text-stone-500"
                >
                  {search
                    ? "Sin coincidencias."
                    : "Sin ingredientes registrados."}
                </td>
              </tr>
            )}
            {filtrados.map((ing) => (
              <tr
                key={ing.idIngrediente}
                className="hover:bg-stone-100/80 dark:hover:bg-stone-800/30 transition-colors"
              >
                <Td>
                  <span className="font-medium text-stone-900 dark:text-stone-50">
                    {ing.nombreIngrediente}
                  </span>
                </Td>
                <Td className="text-stone-600 dark:text-stone-400">
                  {ing.unidad}
                </Td>
                <Td>
                  <span
                    className={classNames(
                      "font-semibold tabular-nums",
                      ing.alerta_stock
                        ? "text-red-600 dark:text-red-400"
                        : "text-stone-900 dark:text-stone-50",
                    )}
                  >
                    {ing.stock}
                  </span>
                  <StockBar stock={ing.stock} stockMinimo={ing.stock_minimo} />
                </Td>
                <Td className="text-stone-600 dark:text-stone-400 tabular-nums">
                  {ing.stock_minimo}
                </Td>
                <Td>
                  {ing.alerta_stock ? (
                    <AlertaBadge />
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      OK
                    </span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Btn
                      size="sm"
                      variant="primary"
                      onClick={() => abrirMovimiento(ing)}
                    >
                      Mover stock
                    </Btn>
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() => abrirEditar(ing)}
                    >
                      Editar
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => abrirHistorial(ing)}
                    >
                      Historial
                    </Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {modalIngr && (
        <ModalIngrediente
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          onSave={guardarIngrediente}
          onClose={() => setModalIngr(false)}
        />
      )}
      {modalMov && ingredSelec && (
        <ModalMovimiento
          ingrediente={ingredSelec}
          mov={movDraft}
          setMov={setMovDraft}
          saving={saving}
          onSave={guardarMovimiento}
          onClose={() => setModalMov(false)}
        />
      )}
      {modalHist && ingredSelec && (
        <ModalHistorial
          ingrediente={ingredSelec}
          onClose={() => setModalHist(false)}
        />
      )}
    </>
  );
}

function emptyHistorialFiltros() {
  return {
    ingrediente: "",
    usuario: "",
    fecha_desde: "",
    fecha_hasta: "",
  };
}

function buildHistorialQuery(soloCocina, filtros) {
  const p = new URLSearchParams();
  if (soloCocina) p.set("solo_cocina", "1");
  const ing = filtros.ingrediente?.trim();
  const usr = filtros.usuario?.trim();
  if (ing) p.set("ingrediente", ing);
  if (usr) p.set("usuario", usr);
  if (filtros.fecha_desde) p.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) p.set("fecha_hasta", filtros.fecha_hasta);
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Tab: Historial de movimientos (cocinero + admin) ───

function PanelHistorial({
  historial,
  loading,
  soloCocina,
  onToggleSoloCocina,
  filtros,
  onChangeFiltros,
  onAplicarFiltros,
  onLimpiarFiltros,
}) {
  const tipoBadge = (tipo) => {
    if (tipo === "ENTRADA")
      return "bg-emerald-900/60 text-emerald-300 border-emerald-700/50";
    if (tipo === "SALIDA")
      return "bg-red-900/60 text-red-300 border-red-700/50";
    return "bg-amber-900/60 text-amber-300 border-amber-700/50";
  };

  const hayFiltrosActivos = Boolean(
    filtros.ingrediente?.trim() ||
      filtros.usuario?.trim() ||
      filtros.fecha_desde ||
      filtros.fecha_hasta,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Registro permanente de entradas, salidas y ajustes. Los cambios del cocinero aparecen aquí; no se pueden eliminar.
      </p>

      <div className={classNames(panelClass, "p-4 space-y-4")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
            Filtros
          </p>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={soloCocina}
              onChange={(e) => onToggleSoloCocina(e.target.checked)}
              className="rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500"
            />
            Solo cambios del cocinero
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="Ingrediente"
            placeholder="Ej. Arroz, Pollo…"
            value={filtros.ingrediente}
            onChange={(e) =>
              onChangeFiltros((f) => ({ ...f, ingrediente: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onAplicarFiltros();
            }}
          />
          <Input
            label="Usuario"
            placeholder="Nombre del responsable…"
            value={filtros.usuario}
            onChange={(e) =>
              onChangeFiltros((f) => ({ ...f, usuario: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onAplicarFiltros();
            }}
          />
          <Input
            label="Fecha desde"
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) =>
              onChangeFiltros((f) => ({ ...f, fecha_desde: e.target.value }))
            }
          />
          <Input
            label="Fecha hasta"
            type="date"
            value={filtros.fecha_hasta}
            min={filtros.fecha_desde || undefined}
            onChange={(e) =>
              onChangeFiltros((f) => ({ ...f, fecha_hasta: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Btn onClick={onAplicarFiltros} disabled={loading}>
            {loading ? "Buscando…" : "Aplicar filtros"}
          </Btn>
          <Btn
            variant="secondary"
            onClick={onLimpiarFiltros}
            disabled={loading || (!hayFiltrosActivos && !soloCocina)}
          >
            Limpiar
          </Btn>
          {historial != null ? (
            <span className="text-xs text-stone-600 dark:text-stone-500 ml-1">
              {historial.total} resultado{historial.total !== 1 ? "s" : ""}
              {historial.total >= 250 ? " (máx. 250)" : ""}
            </span>
          ) : null}
        </div>
      </div>

      {loading ? <Spinner /> : null}

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900">
        <table className="w-full">
          <thead className="bg-stone-100 dark:bg-stone-950/50">
            <tr>
              {["Fecha", "Ingrediente", "Tipo", "Cantidad", "Motivo", "Usuario"].map(
                (h) => (
                  <Th key={h}>{h}</Th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {(historial?.data ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-stone-600 dark:text-stone-500"
                >
                  {hayFiltrosActivos || soloCocina
                    ? "Sin movimientos con esos filtros."
                    : "Sin movimientos registrados."}
                </td>
              </tr>
            ) : (
              historial.data.map((m) => (
                <tr
                  key={m.idMovimiento}
                  className="hover:bg-stone-100/80 dark:hover:bg-stone-800/30"
                >
                  <Td className="text-stone-600 dark:text-stone-500 whitespace-nowrap">
                    {m.fecha?.slice(0, 16).replace("T", " ")}
                  </Td>
                  <Td className="font-medium text-stone-900 dark:text-stone-50">
                    {m.ingrediente?.nombreIngrediente ?? "—"}
                    {m.ingrediente?.unidad ? (
                      <span className="text-xs text-stone-500 ml-1">
                        ({m.ingrediente.unidad})
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    <span
                      className={classNames(
                        "text-xs font-semibold px-2 py-0.5 rounded-full border",
                        tipoBadge(m.tipo),
                      )}
                    >
                      {m.tipo}
                    </span>
                  </Td>
                  <Td className="text-stone-900 dark:text-stone-50 font-medium tabular-nums whitespace-nowrap">
                    {m.tipo === "SALIDA" ? "-" : "+"}
                    {m.cantidad}
                  </Td>
                  <Td className="text-stone-700 dark:text-stone-300 max-w-[200px] truncate">
                    {m.motivo}
                  </Td>
                  <Td className="text-stone-600 dark:text-stone-500">
                    <div>{m.usuario}</div>
                    {m.usuario_rol ? (
                      <div className="text-[10px] uppercase tracking-wide text-stone-500 mt-0.5">
                        {m.usuario_rol}
                      </div>
                    ) : null}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Alertas (HU17) ────────────────────────────────

function PanelAlertas({ alertas }) {
  if (!alertas) return <Spinner />;

  return (
    <div className="space-y-4">
      {alertas.total_alertas === 0 ? (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-10 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Todo el inventario está en niveles normales
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-500 mt-1">
            Ningún ingrediente está por debajo de su stock mínimo.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center gap-3">
            <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
              {alertas.total_alertas} ingrediente
              {alertas.total_alertas !== 1 ? "s" : ""} con stock bajo o agotado
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertas.data.map((ing) => (
              <div
                key={ing.idIngrediente}
                className="rounded-xl border border-red-300 dark:border-red-800/50 bg-white dark:bg-stone-900 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                      {ing.nombreIngrediente}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-500">
                      {ing.unidad}
                    </p>
                  </div>
                  <AlertaBadge />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-500">
                      Stock actual
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {ing.stock} {ing.unidad}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-500">
                      Mínimo
                    </span>
                    <span className="text-stone-600 dark:text-stone-400">
                      {ing.stock_minimo} {ing.unidad}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-500">
                      Faltan
                    </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {Math.max(0, ing.stock_minimo - ing.stock).toFixed(2)}{" "}
                      {ing.unidad}
                    </span>
                  </div>
                </div>
                <StockBar stock={ing.stock} stockMinimo={ing.stock_minimo} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────

export function AdminInventarioPage() {
  const [tab, setTab] = useState("stock");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [soloCocinaHistorial, setSoloCocinaHistorial] = useState(true);
  const [historialFiltros, setHistorialFiltros] = useState(emptyHistorialFiltros);
  const [historialFiltrosAplicados, setHistorialFiltrosAplicados] =
    useState(emptyHistorialFiltros);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, alr] = await Promise.all([
        apiFetch(`${API_BASE}/admin/inventario/ingredientes`),
        apiFetch(`${API_BASE}/admin/inventario/alertas`),
      ]);
      setData(inv);
      setAlertas(alr);
    } catch (err) {
      void adminAlertError(err, "Inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarHistorial = useCallback(async (soloCocina, filtros) => {
    setHistorialLoading(true);
    try {
      const qs = buildHistorialQuery(soloCocina, filtros);
      const res = await apiFetch(`${API_BASE}/admin/inventario/movimientos${qs}`);
      setHistorial(res);
    } catch (err) {
      void adminAlertError(err, "Historial de inventario");
      setHistorial(null);
    } finally {
      setHistorialLoading(false);
    }
  }, []);

  function aplicarFiltrosHistorial() {
    setHistorialFiltrosAplicados({ ...historialFiltros });
  }

  function limpiarFiltrosHistorial() {
    const vacio = emptyHistorialFiltros();
    setHistorialFiltros(vacio);
    setHistorialFiltrosAplicados(vacio);
    setSoloCocinaHistorial(false);
  }

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (tab !== "historial") return;
    void cargarHistorial(soloCocinaHistorial, historialFiltrosAplicados);
  }, [tab, soloCocinaHistorial, historialFiltrosAplicados, cargarHistorial]);

  return (
    <AdminLayout title="Inventario">
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
            Inventario de ingredientes
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Gestiona el stock de ingredientes, registra movimientos y revisa
            alertas.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <TabButton
              key={t.id}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
              badge={t.id === "alertas" ? alertas?.total_alertas : null}
            >
              {t.label}
            </TabButton>
          ))}
        </div>

        {loading && tab !== "historial" ? (
          <Spinner />
        ) : tab === "stock" ? (
          <StockGeneral data={data} onRecargar={cargar} />
        ) : tab === "alertas" ? (
          <PanelAlertas alertas={alertas} />
        ) : (
          <PanelHistorial
            historial={historial}
            loading={historialLoading}
            soloCocina={soloCocinaHistorial}
            onToggleSoloCocina={setSoloCocinaHistorial}
            filtros={historialFiltros}
            onChangeFiltros={setHistorialFiltros}
            onAplicarFiltros={aplicarFiltrosHistorial}
            onLimpiarFiltros={limpiarFiltrosHistorial}
          />
        )}
      </div>
    </AdminLayout>
  );
}
