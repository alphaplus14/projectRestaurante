import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { apiFetch } from '../auth/apiClient';
import { staffLoginUrl } from '../auth/staffLogin';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';
import { confirmStaffLogout } from '../utils/confirmLogout';

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
    { value: 'nombre_asc', label: 'Nombre A–Z' },
    { value: 'stock_asc', label: 'Menor stock primero' },
    { value: 'stock_desc', label: 'Mayor stock primero' },
    { value: 'alertas_primero', label: 'Alertas primero' },
];

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const fieldClass =
    'w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500';

const panelClass = 'rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900';

function sortIngredientes(lista, sortBy) {
    const items = [...lista];
    switch (sortBy) {
        case 'stock_asc':
            return items.sort((a, b) => a.stock - b.stock || a.nombreIngrediente.localeCompare(b.nombreIngrediente, 'es'));
        case 'stock_desc':
            return items.sort((a, b) => b.stock - a.stock || a.nombreIngrediente.localeCompare(b.nombreIngrediente, 'es'));
        case 'alertas_primero':
            return items.sort((a, b) => {
                if (a.alerta_stock !== b.alerta_stock) return a.alerta_stock ? -1 : 1;
                return a.stock - b.stock;
            });
        case 'nombre_asc':
        default:
            return items.sort((a, b) => a.nombreIngrediente.localeCompare(b.nombreIngrediente, 'es'));
    }
}

function StockBar({ stock, stockMinimo }) {
    const pct = stockMinimo > 0 ? Math.min((stock / stockMinimo) * 100, 400) : 100;
    const color = stock <= stockMinimo ? 'bg-red-500' : stock <= stockMinimo * 2 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mt-1">
            <div className={classNames('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
    );
}

function AlertaBadge() {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-900/40 border border-red-700/50 px-2 py-0.5 text-xs font-semibold text-red-300">
            Stock bajo
        </span>
    );
}

function emptyMovimiento() {
    return { tipo: 'ENTRADA', cantidad: '', motivo: '', referencia: '' };
}

function ModalMovimiento({ ingrediente, mov, setMov, saving, onSave, onClose }) {
    const tipoLabels = {
        ENTRADA: { label: 'Entrada', hint: 'Suma al stock actual', color: 'text-emerald-600 dark:text-emerald-400' },
        SALIDA: { label: 'Salida', hint: 'Resta del stock actual', color: 'text-red-600 dark:text-red-400' },
        AJUSTE: { label: 'Ajuste', hint: 'Define el stock exacto', color: 'text-amber-600 dark:text-amber-400' },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
            <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Registrar movimiento</h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {ingrediente.nombreIngrediente} — stock actual:{' '}
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                        {ingrediente.stock} {ingrediente.unidad}
                    </span>
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(tipoLabels).map(([tipo, info]) => (
                                <button
                                    key={tipo}
                                    type="button"
                                    onClick={() => setMov((m) => ({ ...m, tipo }))}
                                    className={classNames(
                                        'rounded-lg border px-2 py-2 text-xs font-semibold transition-colors',
                                        mov.tipo === tipo
                                            ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                            : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600',
                                    )}
                                >
                                    {info.label}
                                </button>
                            ))}
                        </div>
                        <p className={classNames('text-xs mt-1.5', tipoLabels[mov.tipo].color)}>{tipoLabels[mov.tipo].hint}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                            {mov.tipo === 'AJUSTE' ? 'Nuevo stock' : 'Cantidad'}
                        </label>
                        <input
                            type="number"
                            min="0.0001"
                            step="0.01"
                            value={mov.cantidad}
                            onChange={(e) => setMov((m) => ({ ...m, cantidad: e.target.value }))}
                            className={fieldClass}
                            placeholder={`en ${ingrediente.unidad}`}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Motivo</label>
                        <input
                            type="text"
                            value={mov.motivo}
                            onChange={(e) => setMov((m) => ({ ...m, motivo: e.target.value }))}
                            className={fieldClass}
                            placeholder="Ej. Uso en servicio, reposición, merma…"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Referencia (opcional)</label>
                        <input
                            type="text"
                            value={mov.referencia}
                            onChange={(e) => setMov((m) => ({ ...m, referencia: e.target.value }))}
                            className={fieldClass}
                            placeholder="Ej. Turno mañana, pedido #12…"
                        />
                    </div>
                </div>

                <p className="mt-4 text-xs text-stone-500 dark:text-stone-500">
                    Este cambio quedará en el historial del administrador y no se puede eliminar.
                </p>

                <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onSave}
                        className="rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-2.5 text-sm disabled:opacity-60"
                    >
                        {saving ? 'Guardando…' : 'Registrar movimiento'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ModalHistorial({ ingrediente, onClose }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch(`/api/cocina/inventario/ingredientes/${ingrediente.idIngrediente}/movimientos`)
            .then(setData)
            .catch((e) => setError(e?.message || 'No se pudo cargar el historial.'))
            .finally(() => setLoading(false));
    }, [ingrediente.idIngrediente]);

    const tipoBadge = (tipo) => {
        if (tipo === 'ENTRADA') return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
        if (tipo === 'SALIDA') return 'bg-red-900/60 text-red-300 border-red-700/50';
        return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
            <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xl max-h-[85vh] flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Historial de movimientos</h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400">{ingrediente.nombreIngrediente}</p>
                        <p className="text-xs text-stone-500 mt-1">Solo lectura · visible también en el panel de administración</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        Cerrar
                    </button>
                </div>

                {loading ? <p className="text-sm text-stone-500 py-8 text-center">Cargando historial…</p> : null}
                {error ? <p className="text-sm text-red-600 dark:text-red-400 py-4">{error}</p> : null}

                {data ? (
                    <div className="overflow-y-auto flex-1 -mx-2 px-2">
                        {data.data.length === 0 ? (
                            <p className="text-sm text-stone-500 py-8 text-center">Sin movimientos registrados.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wide text-stone-500">
                                        {['Fecha', 'Tipo', 'Cantidad', 'Motivo', 'Usuario'].map((h) => (
                                            <th key={h} className="px-3 py-2 text-left font-semibold">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                    {data.data.map((m) => (
                                        <tr key={m.idMovimiento} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                                            <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{m.fecha?.slice(0, 16).replace('T', ' ')}</td>
                                            <td className="px-3 py-2">
                                                <span className={classNames('text-xs font-semibold px-2 py-0.5 rounded-full border', tipoBadge(m.tipo))}>{m.tipo}</span>
                                            </td>
                                            <td className="px-3 py-2 font-medium tabular-nums text-stone-900 dark:text-stone-50">
                                                {m.tipo === 'SALIDA' ? '-' : '+'}
                                                {m.cantidad} {ingrediente.unidad}
                                            </td>
                                            <td className="px-3 py-2 text-stone-700 dark:text-stone-300">{m.motivo}</td>
                                            <td className="px-3 py-2 text-stone-500">
                                                <div>{m.usuario}</div>
                                                {m.usuario_rol ? <div className="text-[10px] uppercase mt-0.5">{m.usuario_rol}</div> : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export function CocinaInventarioPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [alertas, setAlertas] = useState(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('alertas_primero');
    const [soloBajoStock, setSoloBajoStock] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [saving, setSaving] = useState(false);
    const [modalMov, setModalMov] = useState(false);
    const [modalHist, setModalHist] = useState(false);
    const [movDraft, setMovDraft] = useState(emptyMovimiento());
    const [ingredSelec, setIngredSelec] = useState(null);
    const [loadError, setLoadError] = useState('');

    const cargar = useCallback(async (opts = {}) => {
        const silent = Boolean(opts.silent);
        if (!silent) setLoading(true);
        try {
            const [inv, alr] = await Promise.all([
                apiFetch('/api/cocina/inventario/ingredientes'),
                apiFetch('/api/cocina/inventario/alertas'),
            ]);
            setData(inv);
            setAlertas(alr);
            setLoadError('');
        } catch (e) {
            const msg = e?.message || 'No se pudo cargar el inventario.';
            setLoadError(msg);
            if (!silent) setData(null);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    useEffect(() => {
        const id = window.setInterval(() => void cargar({ silent: true }), 30000);
        return () => window.clearInterval(id);
    }, [cargar]);

    useEffect(() => {
        setPagina(1);
    }, [search, sortBy, soloBajoStock]);

    useEffect(() => {
        if (!alertas || alertas.total_alertas === 0) return;

        const key = `napa:cocina-inv-alert:${alertas.data.map((i) => `${i.idIngrediente}-${i.stock}`).join(',')}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch {
            /* ignore */
        }

        const dark = document.documentElement.classList.contains('dark');
        void Swal.fire({
            icon: 'warning',
            title: 'Stock bajo',
            html: `<p class="text-sm">${alertas.total_alertas} ingrediente${alertas.total_alertas !== 1 ? 's' : ''} por debajo del mínimo.</p>`,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d97706',
            background: dark ? '#1c1917' : '#fafaf9',
            color: dark ? '#fafaf9' : '#1c1917',
        });
    }, [alertas]);

    const filtrados = useMemo(() => {
        let lista = data?.data ?? [];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            lista = lista.filter((i) => i.nombreIngrediente.toLowerCase().includes(q));
        }
        if (soloBajoStock) {
            lista = lista.filter((i) => i.alerta_stock);
        }
        return sortIngredientes(lista, sortBy);
    }, [data, search, sortBy, soloBajoStock]);

    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE)), [filtrados.length]);

    const paginados = useMemo(() => {
        const start = (pagina - 1) * PAGE_SIZE;
        return filtrados.slice(start, start + PAGE_SIZE);
    }, [filtrados, pagina]);

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    async function guardarMovimiento() {
        if (!ingredSelec) return;
        const cantidad = parseFloat(movDraft.cantidad);
        const motivo = movDraft.motivo.trim();
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            void Swal.fire({ icon: 'info', title: 'Cantidad inválida', text: 'Indica una cantidad mayor a cero.' });
            return;
        }
        if (!motivo) {
            void Swal.fire({ icon: 'info', title: 'Falta el motivo', text: 'Describe brevemente el cambio de stock.' });
            return;
        }

        setSaving(true);
        try {
            await apiFetch(`/api/cocina/inventario/ingredientes/${ingredSelec.idIngrediente}/movimiento`, {
                method: 'POST',
                body: JSON.stringify({
                    tipo: movDraft.tipo,
                    cantidad,
                    motivo,
                    referencia: movDraft.referencia.trim() || null,
                }),
            });
            setModalMov(false);
            await cargar({ silent: true });
            void Swal.fire({ icon: 'success', title: 'Movimiento registrado', text: 'Quedó guardado en el historial del administrador.', timer: 2200, showConfirmButton: false });
        } catch (e) {
            void Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: e?.message || 'Intenta de nuevo.' });
        } finally {
            setSaving(false);
        }
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

    async function solicitarSalir() {
        const ok = await confirmStaffLogout();
        if (!ok) return;
        clearToken();
        window.location.href = staffLoginUrl('COCINERO');
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-8">
            <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Inventario</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-500">Ingredientes del restaurante · actualización cada 30 s</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/cocina"
                            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Pedidos
                        </Link>
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => void solicitarSalir()}
                            aria-label="Cerrar sesión"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-600/80 bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 px-3 py-2 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                            <img src="/cerrar sesion icon.png" alt="" className="h-4 w-4 shrink-0 object-contain brightness-0 invert" aria-hidden />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
                {loadError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">{loadError}</div>
                ) : null}

                {!loading && data ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className={classNames(panelClass, 'p-4')}>
                            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Total ingredientes</p>
                            <p className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mt-1">{data.total ?? 0}</p>
                        </div>
                        <div className={classNames(panelClass, 'p-4')}>
                            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Stock normal</p>
                            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{(data.total ?? 0) - (data.total_bajo_stock ?? 0)}</p>
                        </div>
                        <div
                            className={classNames(
                                'rounded-xl border p-4',
                                (data.total_bajo_stock ?? 0) > 0
                                    ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800/60'
                                    : panelClass,
                            )}
                        >
                            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Alertas</p>
                            <p className={classNames('text-2xl font-semibold mt-1', (data.total_bajo_stock ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-900 dark:text-stone-50')}>
                                {data.total_bajo_stock ?? 0}
                            </p>
                        </div>
                    </div>
                ) : null}

                {alertas && alertas.total_alertas > 0 ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
                        <img src="/inventario.png" alt="" className="h-5 w-5 shrink-0 object-contain dark:invert mt-0.5" aria-hidden />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                {alertas.total_alertas} ingrediente{alertas.total_alertas !== 1 ? 's' : ''} con stock bajo
                            </p>
                            <p className="text-xs text-red-600/90 dark:text-red-200/80 mt-1">{alertas.data.map((i) => i.nombreIngrediente).join(', ')}</p>
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-3 items-end justify-between">
                    <div className="flex flex-wrap gap-3 items-end flex-1 min-w-0">
                        <div className="min-w-[180px] flex-1 max-w-xs">
                            <label className="block text-xs font-medium text-stone-500 mb-1">Buscar</label>
                            <input
                                type="search"
                                placeholder="Ingrediente…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={fieldClass}
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <label className="block text-xs font-medium text-stone-500 mb-1">Ordenar</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={fieldClass}>
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 pb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={soloBajoStock}
                                onChange={(e) => setSoloBajoStock(e.target.checked)}
                                className="rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500"
                            />
                            Solo bajo stock
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={() => void cargar()}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0"
                    >
                        Actualizar
                    </button>
                </div>

                {loading ? (
                    <div className="text-center text-stone-600 dark:text-stone-400 py-16">Cargando inventario…</div>
                ) : (
                    <>
                        <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-100 dark:bg-stone-950/50 text-xs uppercase tracking-wide text-stone-600 dark:text-stone-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Ingrediente</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Unidad</th>
                                        <th className="px-4 py-3 text-left">Stock actual</th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Mínimo</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Estado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                    {paginados.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-stone-600 dark:text-stone-500">
                                                {search || soloBajoStock ? 'Sin coincidencias con los filtros.' : 'No hay ingredientes registrados por administración.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginados.map((ing) => (
                                            <tr key={ing.idIngrediente} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                                                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-50">{ing.nombreIngrediente}</td>
                                                <td className="px-4 py-3 hidden sm:table-cell text-stone-500">{ing.unidad}</td>
                                                <td className="px-4 py-3">
                                                    <span className={classNames('font-semibold tabular-nums', ing.alerta_stock ? 'text-red-600 dark:text-red-400' : 'text-stone-900 dark:text-stone-50')}>
                                                        {ing.stock}
                                                    </span>
                                                    <StockBar stock={ing.stock} stockMinimo={ing.stock_minimo} />
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell text-stone-500 tabular-nums">{ing.stock_minimo}</td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    {ing.alerta_stock ? (
                                                        <AlertaBadge />
                                                    ) : (
                                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">OK</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirMovimiento(ing)}
                                                            className="rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold px-3 py-1.5"
                                                        >
                                                            Mover stock
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirHistorial(ing)}
                                                            className="rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium px-3 py-1.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                                                        >
                                                            Historial
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filtrados.length > PAGE_SIZE ? (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    {filtrados.length} ingrediente{filtrados.length !== 1 ? 's' : ''}
                                    {` · página ${pagina} de ${totalPaginas}`}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={pagina <= 1}
                                        onClick={() => setPagina((n) => Math.max(1, n - 1))}
                                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400 min-w-[4rem] text-center">
                                        {pagina} / {totalPaginas}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={pagina >= totalPaginas}
                                        onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}

                <p className="text-xs text-stone-600 dark:text-stone-500">
                    Puedes registrar entradas, salidas y ajustes. Cada movimiento queda en el historial del administrador de forma permanente (no se puede borrar).
                </p>
            </div>

            {modalMov && ingredSelec ? (
                <ModalMovimiento
                    ingrediente={ingredSelec}
                    mov={movDraft}
                    setMov={setMovDraft}
                    saving={saving}
                    onSave={() => void guardarMovimiento()}
                    onClose={() => setModalMov(false)}
                />
            ) : null}

            {modalHist && ingredSelec ? <ModalHistorial ingrediente={ingredSelec} onClose={() => setModalHist(false)} /> : null}
        </div>
    );
}
