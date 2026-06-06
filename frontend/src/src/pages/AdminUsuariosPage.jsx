import React, { useEffect, useState } from "react";
import { apiFetch } from "../auth/apiClient";
import { AdminLayout } from "../layouts/AdminLayout";
import { adminAlertError } from "../utils/adminAlerts";

// ─── utilidades ───────────────────────────────────────────────────────────────

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const ROLES = ["ADMINISTRADOR", "MESERO", "COCINERO", "CAJERO"];

const ROL_BADGE = {
  ADMINISTRADOR: "bg-violet-600/15 border-violet-500/30 text-violet-900 dark:text-violet-200",
  MESERO: "bg-amber-600/15 border-amber-500/30 text-amber-900 dark:text-amber-200",
  COCINERO: "bg-orange-600/15 border-orange-500/30 text-orange-900 dark:text-orange-200",
  CAJERO: "bg-blue-600/15 border-blue-500/30 text-blue-900 dark:text-blue-200",
};

function emptyDraft() {
  return {
    idUsuario: null,
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    correo: "",
    password: "",
    rol: "MESERO",
    activo: true,
  };
}

// ─── componentes base (alineados con el sistema de diseño) ────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-stone-700 border-t-amber-500" />
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
      {children}
    </label>
  );
}

function FieldInput({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        {...props}
        className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
    </div>
  );
}

function FieldSelect({ label, children, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        {...props}
        className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {children}
      </select>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState("TODOS");

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  // ── carga ──────────────────────────────────────────────────────────────────

  async function load() {
    setLoading(true);
    try {
      const qs = filtroRol !== "TODOS" ? `?rol=${filtroRol}` : "";
      const data = await apiFetch(`/api/admin/usuarios${qs}`);
      setUsuarios(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      void adminAlertError(err, "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol]);

  // ── modal ──────────────────────────────────────────────────────────────────

  function openCreate() {
    setDraft(emptyDraft());
    setIsOpen(true);
  }

  function openEdit(u) {
    setDraft({
      idUsuario: u.idUsuario,
      nombre: u.nombre ?? "",
      apellido: u.apellido ?? "",
      cedula: u.cedula ?? "",
      telefono: u.telefono ?? "",
      correo: u.correo ?? "",
      password: "",
      rol: u.rol ?? "MESERO",
      activo: Boolean(u.activo),
    });
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setDraft(emptyDraft());
  }

  // ── guardar ────────────────────────────────────────────────────────────────

  async function saveDraft(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nombre: String(draft.nombre || "").trim(),
      apellido: String(draft.apellido || "").trim(),
      cedula: String(draft.cedula || "").trim(),
      telefono: String(draft.telefono || "").trim(),
      correo: String(draft.correo || "").trim(),
      rol: draft.rol,
      activo: Boolean(draft.activo),
    };

    const password = String(draft.password || "").trim();
    if (draft.idUsuario) {
      if (password) payload.password = password;
    } else {
      payload.password = password;
    }

    try {
      if (draft.idUsuario) {
        await apiFetch(`/api/admin/usuarios/${draft.idUsuario}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/usuarios", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await load();
      closeModal();
    } catch (err) {
      void adminAlertError(err, "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  }

  // ── toggle activo ──────────────────────────────────────────────────────────

  async function toggleActivo(u) {
    try {
      await apiFetch(`/api/admin/usuarios/${u.idUsuario}/activo`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !u.activo }),
      });
      await load();
    } catch (err) {
      void adminAlertError(err, "No se pudo cambiar el estado");
    }
  }

  // ── contadores por rol (para los chips de filtro) ──────────────────────────

  const contadores = usuarios.reduce((acc, u) => {
    acc[u.rol] = (acc[u.rol] ?? 0) + 1;
    return acc;
  }, {});

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="Usuarios">
      <div className="space-y-6 max-w-6xl">
        {/* ── cabecera — alineada con el resto del admin ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
              Usuarios y roles
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              Crea, edita o deshabilita usuarios. Puedes cambiar su rol en
              cualquier momento.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="shrink-0 rounded-lg bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold text-sm px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Crear usuario
          </button>
        </div>

        {/* ── chips de filtro por rol ── */}
        <div className="flex flex-wrap gap-2">
          {["TODOS", ...ROLES].map((r) => {
            const activo = filtroRol === r;
            const count =
              r === "TODOS" ? usuarios.length : (contadores[r] ?? 0);
            return (
              <button
                key={r}
                onClick={() => setFiltroRol(r)}
                className={classNames(
                  "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  activo
                    ? "bg-amber-600 border-amber-500 text-stone-950"
                    : "border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 hover:text-stone-900 dark:hover:text-stone-200",
                )}
              >
                {r === "TODOS"
                  ? "Todos"
                  : r.charAt(0) + r.slice(1).toLowerCase()}
                <span
                  className={classNames(
                    "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                    activo ? "bg-amber-700/50" : "bg-stone-200 dark:bg-stone-800",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── tabla ── */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-100 dark:bg-stone-950/50">
                  <tr className="border-b border-stone-200 dark:border-stone-800">
                    {[
                      "Nombre",
                      "Correo",
                      "Teléfono",
                      "Rol",
                      "Estado",
                      "Acciones",
                    ].map((h) => (
                      <th
                        key={h}
                        className={classNames(
                          "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400",
                          h === "Acciones" ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {usuarios.map((u) => (
                    <tr
                      key={u.idUsuario}
                      className="hover:bg-stone-100/80 dark:hover:bg-stone-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900 dark:text-stone-50">
                          {u.nombre} {u.apellido}
                        </div>
                        <div className="mt-0.5 text-stone-500 dark:text-stone-500 text-xs">
                          Cédula: {u.cedula}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                        {u.correo}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                        {u.telefono}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={classNames(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            ROL_BADGE[u.rol] ??
                              "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300",
                          )}
                        >
                          {u.rol
                            ? u.rol.charAt(0) + u.rol.slice(1).toLowerCase()
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.activo ? (
                          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-900 dark:text-amber-200">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-400">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(u)}
                            className={classNames(
                              "inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                              u.activo
                                ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                                : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 border border-amber-500/30",
                            )}
                          >
                            {u.activo ? "Deshabilitar" : "Habilitar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {usuarios.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-sm text-stone-500"
                        colSpan={6}
                      >
                        {filtroRol === "TODOS"
                          ? "No hay usuarios registrados aún."
                          : `No hay usuarios con rol ${filtroRol.charAt(0) + filtroRol.slice(1).toLowerCase()}.`}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── modal crear / editar ── */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 shadow-2xl">
            {/* cabecera modal */}
            <div className="flex items-start justify-between gap-6 mb-5">
              <div>
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
                  {draft.idUsuario ? "Editar usuario" : "Crear usuario"}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {draft.idUsuario
                    ? "Deja la contraseña vacía para no cambiarla."
                    : "La contraseña es obligatoria al crear."}
                </p>
              </div>
              <button
                onClick={closeModal}
                type="button"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Cerrar
              </button>
            </div>

            <form className="space-y-4" onSubmit={saveDraft}>
              {/* nombre / apellido */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldInput
                  label="Nombre"
                  value={draft.nombre}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, nombre: e.target.value }))
                  }
                  required
                />
                <FieldInput
                  label="Apellido"
                  value={draft.apellido}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, apellido: e.target.value }))
                  }
                  required
                />
              </div>

              {/* cédula / teléfono */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldInput
                  label="Cédula"
                  value={draft.cedula}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, cedula: e.target.value }))
                  }
                  required
                />
                <FieldInput
                  label="Teléfono"
                  value={draft.telefono}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, telefono: e.target.value }))
                  }
                  required
                />
              </div>

              {/* correo */}
              <FieldInput
                label="Correo"
                type="email"
                value={draft.correo}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, correo: e.target.value }))
                }
                autoComplete="email"
                required
              />

              {/* contraseña / rol */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldInput
                    label={`Contraseña${draft.idUsuario ? " (opcional)" : ""}`}
                    type="password"
                    minLength={draft.idUsuario ? undefined : 6}
                    value={draft.password}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, password: e.target.value }))
                    }
                    autoComplete="new-password"
                    required={!draft.idUsuario}
                  />
                  {!draft.idUsuario ? (
                    <p className="mt-1 text-xs text-stone-500">
                      Mínimo 6 caracteres (requisito del sistema).
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-stone-500">
                      Si la cambias, mínimo 6 caracteres.
                    </p>
                  )}
                </div>
                <FieldSelect
                  label="Rol"
                  value={draft.rol}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, rol: e.target.value }))
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </option>
                  ))}
                </FieldSelect>
              </div>

              {/* estado */}
              <FieldSelect
                label="Estado"
                value={draft.activo ? "1" : "0"}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, activo: e.target.value === "1" }))
                }
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </FieldSelect>

              {/* botones */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-orange-700 hover:bg-orange-600 text-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
