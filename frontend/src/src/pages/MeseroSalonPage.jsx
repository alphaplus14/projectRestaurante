import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';

function formatMoney(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
        Number(n),
    );
}

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const ESTADO_LABEL = {
    PENDIENTE: 'Enviado a cocina',
    EN_PREPARACION: 'En preparación',
    LISTO: 'Listo',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
};

export function MeseroSalonPage() {
    const [mesas, setMesas] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [pedido, setPedido] = useState(null);
    const [banner, setBanner] = useState('');
    const [loadingMesas, setLoadingMesas] = useState(true);
    const [loadingPedido, setLoadingPedido] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [cerrando, setCerrando] = useState(false);
    const [qtyByProduct, setQtyByProduct] = useState({});
    const [notaByProduct, setNotaByProduct] = useState({});

    const selectedMesa = useMemo(() => mesas.find((m) => m.idMesa === selectedId), [mesas, selectedId]);

    const fetchMesas = useCallback(async () => {
        try {
            const res = await apiFetch('/api/mesero/mesas');
            setMesas(Array.isArray(res?.data) ? res.data : []);
            setBanner('');
        } catch (e) {
            setBanner(e?.message || 'No se pudieron cargar las mesas.');
        } finally {
            setLoadingMesas(false);
        }
    }, []);

    const fetchCatalogo = useCallback(async () => {
        try {
            const res = await apiFetch('/api/mesero/productos');
            setCatalogo(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            setBanner(e?.message || 'No se pudo cargar el menú.');
        }
    }, []);

    const loadPedido = useCallback(async (idPedido) => {
        setLoadingPedido(true);
        try {
            const res = await apiFetch(`/api/mesero/pedidos/${idPedido}`);
            setPedido(res?.data ?? null);
            setBanner('');
        } catch (e) {
            setPedido(null);
            setBanner(e?.message || 'No se pudo cargar el pedido.');
        } finally {
            setLoadingPedido(false);
        }
    }, []);

    useEffect(() => {
        fetchMesas();
        fetchCatalogo();
    }, [fetchMesas, fetchCatalogo]);

    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') fetchMesas();
        }, 8000);
        return () => clearInterval(id);
    }, [fetchMesas]);

    useEffect(() => {
        if (!selectedId) {
            setPedido(null);
            return;
        }
        const snap = mesas.find((m) => m.idMesa === selectedId);
        if (snap?.pedido_activo?.bloqueado) {
            setPedido(null);
            return;
        }
        if (snap?.pedido_activo?.idPedido) {
            void loadPedido(snap.pedido_activo.idPedido);
        } else {
            setPedido(null);
        }
    }, [selectedId, mesas, loadPedido]);

    async function abrirCuenta() {
        if (!selectedId) return;
        setBanner('');
        try {
            const res = await apiFetch('/api/mesero/pedidos', {
                method: 'POST',
                body: JSON.stringify({ mesa_idMesa: selectedId }),
            });
            const p = res?.data;
            if (p?.idPedido) {
                setPedido(p);
                await fetchMesas();
            }
        } catch (e) {
            setBanner(e?.message || 'No se pudo abrir la cuenta.');
        }
    }

    async function agregarProducto(idProducto) {
        if (!pedido?.idPedido) return;
        const qty = Math.min(99, Math.max(1, Number(qtyByProduct[idProducto]) || 1));
        const nota = notaByProduct[idProducto]?.trim() || null;
        setAddingId(idProducto);
        setBanner('');
        try {
            await apiFetch(`/api/mesero/pedidos/${pedido.idPedido}/detalles`, {
                method: 'POST',
                body: JSON.stringify({
                    producto_idProducto: idProducto,
                    cantidad: qty,
                    nota,
                }),
            });
            await loadPedido(pedido.idPedido);
            await fetchMesas();
            setQtyByProduct((prev) => ({ ...prev, [idProducto]: 1 }));
            setNotaByProduct((prev) => ({ ...prev, [idProducto]: '' }));
        } catch (e) {
            setBanner(e?.message || 'No se pudo agregar el producto.');
        } finally {
            setAddingId(null);
        }
    }

    async function cerrarCuenta() {
        if (!pedido?.idPedido || pedido.estado !== 'LISTO') return;
        if (!window.confirm('¿Cerrar la cuenta? La mesa quedará libre para un nuevo servicio.')) return;
        setCerrando(true);
        setBanner('');
        try {
            const res = await apiFetch(`/api/mesero/pedidos/${pedido.idPedido}/cerrar`, {
                method: 'POST',
            });
            setPedido(null);
            setBanner(res?.message || 'Cuenta cerrada.');
            await fetchMesas();
        } catch (e) {
            setBanner(e?.message || 'No se pudo cerrar la cuenta.');
        } finally {
            setCerrando(false);
        }
    }

    function onSalir() {
        clearToken();
        window.location.href = '/login-mesero';
    }

    const catalogoPorCat = useMemo(() => {
        const map = new Map();
        for (const p of catalogo) {
            const cat = p.categoria?.nombre || 'Otros';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat).push(p);
        }
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [catalogo]);

    const totalPedido = useMemo(() => {
        if (!pedido?.detalles?.length) return 0;
        return pedido.detalles.reduce((s, l) => s + Number(l.precio_unitario) * Number(l.cantidad), 0);
    }, [pedido]);

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-[1600px] px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-emerald-100">Salón — meseros</h1>
                        <p className="text-sm text-stone-500">Mesas y pedidos · menú cada carga · mesas ~8 s</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchMesas()}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-white/10"
                        >
                            Actualizar mesas
                        </button>
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-stone-400 hover:text-stone-200"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1600px] px-4 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
                {banner ? (
                    <div className="xl:col-span-12 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                        {banner}
                    </div>
                ) : null}

                <section className="xl:col-span-4 space-y-3">
                    <h2 className="text-lg font-semibold text-stone-100">Mesas</h2>
                    {loadingMesas ? (
                        <p className="text-stone-500 text-sm">Cargando…</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3">
                            {mesas.map((m) => {
                                const active = m.pedido_activo;
                                const sel = selectedId === m.idMesa;
                                const bloqueado = active?.bloqueado;
                                return (
                                    <button
                                        key={m.idMesa}
                                        type="button"
                                        onClick={() => setSelectedId(m.idMesa)}
                                        className={classNames(
                                            'rounded-2xl border p-3 text-left transition-colors',
                                            sel
                                                ? 'border-emerald-400/50 bg-emerald-950/40'
                                                : 'border-white/10 bg-stone-900/80 hover:border-white/20',
                                        )}
                                    >
                                        <div className="text-xs text-stone-500">Mesa</div>
                                        <div className="text-xl font-bold text-stone-50">{m.nombre || `#${m.numero}`}</div>
                                        <div className="text-xs mt-1 text-stone-400">{m.estado === 'OCUPADA' ? 'Ocupada' : 'Libre'}</div>
                                        {bloqueado ? (
                                            <div className="mt-2 text-xs font-medium text-amber-200/80">Otro mesero ({active.estado})</div>
                                        ) : active?.idPedido ? (
                                            <div className="mt-2 text-xs font-medium text-emerald-300">Pedido #{active.idPedido}</div>
                                        ) : (
                                            <div className="mt-2 text-xs text-stone-600">Sin pedido abierto</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="xl:col-span-8 space-y-4">
                    {!selectedId ? (
                        <div className="rounded-2xl border border-white/10 bg-stone-900/50 p-8 text-center text-stone-500">
                            Selecciona una mesa para ver o crear un pedido.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-white/10 bg-stone-900/60 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm text-stone-500">Mesa seleccionada</div>
                                        <div className="text-2xl font-semibold text-stone-50">
                                            {selectedMesa?.nombre || `Mesa ${selectedMesa?.numero}`}
                                        </div>
                                    </div>
                                    {!pedido && !loadingPedido ? (
                                        selectedMesa?.pedido_activo?.bloqueado ? (
                                            <p className="text-sm text-amber-200/90 max-w-md text-right">
                                                {selectedMesa.pedido_activo.mensaje || 'Pedido de otro mesero.'}
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={abrirCuenta}
                                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
                                            >
                                                Abrir cuenta
                                            </button>
                                        )
                                    ) : null}
                                </div>

                                {loadingPedido ? (
                                    <p className="mt-4 text-stone-500 text-sm">Cargando pedido…</p>
                                ) : pedido ? (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex flex-wrap gap-3 items-center">
                                            <span className="text-sm text-stone-400">Pedido #{pedido.idPedido}</span>
                                            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-stone-200">
                                                {ESTADO_LABEL[pedido.estado] || pedido.estado}
                                            </span>
                                            <span className="text-sm text-stone-300 ml-auto font-medium tabular-nums">
                                                Subtotal {formatMoney(totalPedido)}
                                            </span>
                                        </div>
                                        {pedido.notas ? (
                                            <p className="text-sm text-amber-100/90 rounded-lg border border-amber-900/40 bg-amber-950/30 px-3 py-2">
                                                Nota mesa: {pedido.notas}
                                            </p>
                                        ) : null}
                                        <ul className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                                            {pedido.detalles?.length ? (
                                                pedido.detalles.map((l) => (
                                                    <li key={l.idPedidoDetalle} className="px-3 py-2.5 flex gap-3 text-sm">
                                                        <span className="font-semibold text-emerald-200 tabular-nums w-8">{l.cantidad}×</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-stone-100 truncate">
                                                                {l.producto?.nombreProducto}
                                                            </div>
                                                            {l.nota ? (
                                                                <div className="text-xs text-stone-500">{l.nota}</div>
                                                            ) : null}
                                                        </div>
                                                        <span className="text-stone-400 tabular-nums whitespace-nowrap">
                                                            {formatMoney(Number(l.precio_unitario) * Number(l.cantidad))}
                                                        </span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-3 py-4 text-stone-500 text-sm text-center">Aún no hay ítems.</li>
                                            )}
                                        </ul>
                                        {pedido.estado === 'LISTO' ? (
                                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                                <p className="text-xs text-stone-500 flex-1 min-w-[200px]">
                                                    Cuando el cliente haya pagado (o según política del local), cierra la cuenta para
                                                    liberar la mesa.
                                                </p>
                                                <button
                                                    type="button"
                                                    disabled={cerrando}
                                                    onClick={cerrarCuenta}
                                                    className="rounded-xl bg-stone-200 text-stone-900 px-4 py-2 text-sm font-semibold hover:bg-white disabled:opacity-50"
                                                >
                                                    {cerrando ? 'Cerrando…' : 'Cerrar cuenta'}
                                                </button>
                                            </div>
                                        ) : ['CERRADO', 'CANCELADO'].includes(pedido.estado) ? (
                                            <p className="text-xs text-stone-500">
                                                Este pedido ya no admite nuevos ítems desde aquí.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : selectedMesa?.pedido_activo?.bloqueado ? (
                                    <p className="mt-4 text-stone-500 text-sm">
                                        Mesa ocupada por otro mesero; no puedes abrir cuenta aquí.
                                    </p>
                                ) : (
                                    <p className="mt-4 text-stone-500 text-sm">No hay pedido abierto. Pulsa «Abrir cuenta».</p>
                                )}
                            </div>

                            {pedido && !['LISTO', 'CERRADO', 'CANCELADO'].includes(pedido.estado) ? (
                                <div className="rounded-2xl border border-white/10 bg-stone-900/40 p-4">
                                    <h3 className="text-lg font-semibold text-stone-100 mb-3">Agregar al pedido</h3>
                                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
                                        {catalogoPorCat.map(([cat, items]) => (
                                            <div key={cat}>
                                                <div className="text-xs uppercase tracking-wide text-stone-500 mb-2">{cat}</div>
                                                <ul className="space-y-2">
                                                    {items.map((p) => (
                                                        <li
                                                            key={p.idProducto}
                                                            className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-stone-950/40 p-3"
                                                        >
                                                            <div className="flex-1 min-w-[140px]">
                                                                <div className="font-medium text-stone-100">{p.nombreProducto}</div>
                                                                <div className="text-sm text-emerald-200/90 tabular-nums">{formatMoney(p.precio)}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <label className="sr-only" htmlFor={`q-${p.idProducto}`}>
                                                                    Cantidad
                                                                </label>
                                                                <input
                                                                    id={`q-${p.idProducto}`}
                                                                    type="number"
                                                                    min={1}
                                                                    max={99}
                                                                    className="w-16 rounded-lg bg-stone-900 border border-white/15 px-2 py-1.5 text-sm tabular-nums"
                                                                    value={qtyByProduct[p.idProducto] ?? 1}
                                                                    onChange={(e) =>
                                                                        setQtyByProduct((prev) => ({
                                                                            ...prev,
                                                                            [p.idProducto]: e.target.value,
                                                                        }))
                                                                    }
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className="w-36 rounded-lg bg-stone-900 border border-white/15 px-2 py-1.5 text-sm placeholder:text-stone-600"
                                                                    placeholder="Nota (opc.)"
                                                                    value={notaByProduct[p.idProducto] ?? ''}
                                                                    onChange={(e) =>
                                                                        setNotaByProduct((prev) => ({
                                                                            ...prev,
                                                                            [p.idProducto]: e.target.value,
                                                                        }))
                                                                    }
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={addingId === p.idProducto}
                                                                    onClick={() => agregarProducto(p.idProducto)}
                                                                    className="rounded-lg bg-stone-700 hover:bg-stone-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                                                                >
                                                                    {addingId === p.idProducto ? '…' : 'Añadir'}
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </section>
            </div>

            <p className="text-center text-sm text-stone-600 pb-8">
                <Link to="/login-cocina" className="text-stone-500 hover:text-stone-400">
                    Pantalla cocina
                </Link>
            </p>
        </div>
    );
}
