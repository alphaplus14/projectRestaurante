import React, { useEffect, useState } from "react";
import { apiFetch } from "../auth/apiClient";
import { AdminLayout } from "../layouts/AdminLayout";

// ─── utilidades ───────────────────────────────────────────────────────────────

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const ROLES = ["ADMINISTRADOR", "MESERO", "COCINERO"];

const ROL_BADGE = {
  ADMINISTRADOR: "bg-violet-600/15 border-violet-500/30 text-violet-200",
  MESERO: "bg-amber-600/15  border-amber-500/30  text-amber-200",
  COCINERO: "bg-orange-600/15 border-orange-500/30 text-orange-200",
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

// ─── componente ───────────────────────────────────────────────────────────────

export function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState("TODOS");

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  // ── carga ──────────────────────────────────────────────────────────────────

  async function load() {
    setError("");
    setLoading(true);
    try {
      const qs = filtroRol !== "TODOS" ? `?rol=${filtroRol}` : "";
      const data = await apiFetch(`/api/admin/usuarios${qs}`);
      setUsuarios(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err?.message || "No se pudo cargar los usuarios.");
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
    setError("");
  }

  // ── guardar ────────────────────────────────────────────────────────────────

  async function saveDraft(e) {
    e.preventDefault();
    setError("");
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
      setError(err?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  // ── toggle activo ──────────────────────────────────────────────────────────

  async function toggleActivo(u) {
    setError("");
    try {
      await apiFetch(`/api/admin/usuarios/${u.idUsuario}/activo`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !u.activo }),
      });
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el estado.");
    }
  }

  // ── contadores por rol (para los chips de filtro) ──────────────────────────

  const contadores = usuarios.reduce((acc, u) => {
    acc[u.rol] = (acc[u.rol] ?? 0) + 1;
    return acc;
  }, {});

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout title="Usuarios">
        <div className="flex items-center justify-center text-stone-400 text-lg py-20">
          Cargando usuarios…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Usuarios">
      {/* ── cabecera ── */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="text-3xl font-semibold tracking-tight">
            Usuarios y roles
          </div>
          <div className="mt-2 text-stone-400">
            Crea, edita o deshabilita usuarios. Puedes cambiar su rol en
            cualquier momento.
          </div>
        </div>
        <button
          onClick={openCreate}
          className="bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Crear usuario
        </button>
      </div>

      {/* ── error global ── */}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* ── chips de filtro por rol ── */}
      <div className="mt-8 flex flex-wrap gap-2">
        {["TODOS", ...ROLES].map((r) => {
          const activo = filtroRol === r;
          const count = r === "TODOS" ? usuarios.length : (contadores[r] ?? 0);
          return (
            <button
              key={r}
              onClick={() => setFiltroRol(r)}
              className={classNames(
                "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-amber-500",
                activo
                  ? "bg-amber-600 border-amber-500 text-stone-950"
                  : "border-stone-700 text-stone-400 hover:border-stone-600 hover:text-stone-200",
              )}
            >
              {r === "TODOS" ? "Todos" : r.charAt(0) + r.slice(1).toLowerCase()}
              <span
                className={classNames(
                  "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                  activo ? "bg-amber-700/50" : "bg-stone-800",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── tabla ── */}
      <div className="mt-4 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-stone-400">
              <tr className="border-b border-stone-800">
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3">Correo</th>
                <th className="text-left font-medium px-4 py-3">Teléfono</th>
                <th className="text-left font-medium px-4 py-3">Rol</th>
                <th className="text-left font-medium px-4 py-3">Estado</th>
                <th className="text-right font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {usuarios.map((u) => (
                <tr
                  key={u.idUsuario}
                  className="hover:bg-stone-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {u.nombre} {u.apellido}
                    </div>
                    <div className="mt-0.5 text-stone-500 text-xs">
                      Cédula: {u.cedula}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-400">{u.correo}</td>
                  <td className="px-4 py-3 text-stone-400">{u.telefono}</td>
                  <td className="px-4 py-3">
                    <span
                      className={classNames(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        ROL_BADGE[u.rol] ??
                          "bg-stone-800 border-stone-700 text-stone-300",
                      )}
                    >
                      {u.rol
                        ? u.rol.charAt(0) + u.rol.slice(1).toLowerCase()
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.activo ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-600/15 px-2 py-0.5 text-xs text-amber-200">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-stone-700 bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="px-3 py-2 rounded-lg border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(u)}
                        className={classNames(
                          "px-3 py-2 rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-amber-500",
                          u.activo
                            ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                            : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30",
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
                    className="px-4 py-10 text-center text-stone-400"
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

      {/* ── modal crear / editar ── */}
      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl p-6 relative">
              {/* cabecera modal */}
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-lg font-semibold">
                    {draft.idUsuario ? "Editar usuario" : "Crear usuario"}
                  </div>
                  <div className="mt-1 text-sm text-stone-400">
                    {draft.idUsuario
                      ? "Deja la contraseña vacía para no cambiarla."
                      : "La contraseña es obligatoria al crear."}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg px-3 py-2 border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                  type="button"
                >
                  Cerrar
                </button>
              </div>

              {/* error modal */}
              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={saveDraft}>
                {/* nombre / apellido */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400">
                      Nombre
                    </label>
                    <input
                      value={draft.nombre}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, nombre: e.target.value }))
                      }
                      className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-400">
                      Apellido
                    </label>
                    <input
                      value={draft.apellido}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, apellido: e.target.value }))
                      }
                      className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* cédula / teléfono */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400">
                      Cédula
                    </label>
                    <input
                      value={draft.cedula}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, cedula: e.target.value }))
                      }
                      className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-400">
                      Teléfono
                    </label>
                    <input
                      value={draft.telefono}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, telefono: e.target.value }))
                      }
                      className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* correo */}
                <div>
                  <label className="block text-sm font-medium text-stone-400">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={draft.correo}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, correo: e.target.value }))
                    }
                    className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    autoComplete="email"
                    required
                  />
                </div>

                {/* contraseña / rol */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400">
                      Contraseña {draft.idUsuario ? "(opcional)" : ""}
                    </label>
                    <input
                      type="password"
                      value={draft.password}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, password: e.target.value }))
                      }
                      className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 placeholder:text-stone-500 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      autoComplete="new-password"
                      required={!draft.idUsuario}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-400">
                      Rol
                    </label>
                    <select
                      value={draft.rol}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, rol: e.target.value }))
                      }
                      className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0) + r.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* estado */}
                <div>
                  <label className="block text-sm font-medium text-stone-400">
                    Estado
                  </label>
                  <select
                    value={draft.activo ? "1" : "0"}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        activo: e.target.value === "1",
                      }))
                    }
                    className="mt-2 w-full bg-stone-900 border border-stone-800 text-stone-50 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>

                {/* botones */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg px-6 py-3 border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={classNames(
                      "bg-orange-700 hover:bg-orange-600 text-stone-50 font-semibold rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500",
                      saving ? "opacity-60 cursor-not-allowed" : "",
                    )}
                  >
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
