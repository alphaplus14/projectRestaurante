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

/** Normaliza para búsqueda insensible a mayúsculas y tildes */
function normalizarBusqueda(s) {
    return String(s ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
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
    const [busquedaMenu, setBusquedaMenu] = useState('');

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

    useEffect(() => {
        setBusquedaMenu('');
    }, [selectedId]);

    const catalogoPorCat = useMemo(() => {
        const q = normalizarBusqueda(busquedaMenu.trim());
        const filtrados = !q
            ? catalogo
            : catalogo.filter((p) => {
                  const nombre = normalizarBusqueda(p.nombreProducto);
                  const desc = normalizarBusqueda(p.descripcion);
                  const cat = normalizarBusqueda(p.categoria?.nombre);
                  const tipo = normalizarBusqueda(p.tipo);
                  return nombre.includes(q) || desc.includes(q) || cat.includes(q) || tipo.includes(q);
              });

        const map = new Map();
        for (const p of filtrados) {
            const cat = p.categoria?.nombre || 'Otros';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat).push(p);
        }
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [catalogo, busquedaMenu]);

    const totalPedido = useMemo(() => {
        if (!pedido?.detalles?.length) return 0;
        return pedido.detalles.reduce((s, l) => s + Number(l.precio_unitario) * Number(l.cantidad), 0);
    }, [pedido]);

    const totalCatalogo = catalogo.length;
    const totalFiltrado = useMemo(
        () => catalogoPorCat.reduce((acc, [, items]) => acc + items.length, 0),
        [catalogoPorCat],
    );

    const inputClass =
        'rounded-lg bg-stone-900 border border-stone-800 text-stone-50 px-2 py-1.5 text-sm tabular-nums placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500';

    return (
        <div className="min-h-screen bg-stone-950 text-stone-50 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/95 backdrop-blur">
                <div className="mx-auto max-w-[1600px] px-3 sm:px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-stone-50 truncate">Salón — mesero</h1>
                        <p className="text-xs sm:text-sm text-stone-500 truncate">
                            Toca una mesa · pedido y menú · actualización automática
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => fetchMesas()}
                            className="rounded-lg border border-stone-800 bg-stone-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Actualizar
                        </button>
                        <button
                            type="button"
                            onClick={onSalir}
                            className="rounded-lg border border-stone-800 px-3 sm:px-4 py-2 text-xs sm:text-sm text-stone-400 hover:text-stone-200 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {banner ? (
                    <div className="lg:col-span-12 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 sm:px-4 py-3 text-sm text-amber-100">
                        {banner}
                    </div>
                ) : null}

                <section
                    className={classNames(
                        'space-y-3 lg:col-span-4',
                        selectedId ? 'hidden lg:block' : '',
                    )}
                >
                    <h2 className="text-base sm:text-lg font-semibold text-stone-50">Mesas</h2>
                    {loadingMesas ? (
                        <p className="text-stone-500 text-sm">Cargando…</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3">
                            {mesas.map((m) => {
                                const active = m.pedido_activo;
                                const sel = selectedId === m.idMesa;
                                const bloqueado = active?.bloqueado;
                                const ocupada = m.estado === 'OCUPADA';
                                return (
                                    <button
                                        key={m.idMesa}
                                        type="button"
                                        onClick={() => setSelectedId(m.idMesa)}
                                        className={classNames(
                                            'rounded-xl border p-3 sm:p-3.5 text-left transition-colors min-h-[88px] active:scale-[0.98]',
                                            sel
                                                ? 'border-amber-500 bg-amber-600/10 ring-1 ring-amber-500/40'
                                                : 'border-stone-800 bg-stone-900 hover:border-stone-700',
                                        )}
                                    >
                                        <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wide">Mesa</div>
                                        <div className="text-lg sm:text-xl font-bold text-stone-50 leading-tight truncate">
                                            {m.nombre || `#${m.numero}`}
                                        </div>
                                        <div
                                            className={classNames(
                                                'text-[10px] sm:text-xs mt-1 font-medium',
                                                ocupada ? 'text-orange-400' : 'text-stone-400',
                                            )}
                                        >
                                            {ocupada ? 'Ocupada' : 'Libre'}
                                        </div>
                                        {bloqueado ? (
                                            <div className="mt-1.5 text-[10px] sm:text-xs text-amber-200/90 line-clamp-2">
                                                Otro mesero ({active.estado})
                                            </div>
                                        ) : active?.idPedido ? (
                                            <div className="mt-1.5 text-[10px] sm:text-xs font-medium text-amber-400">
                                                Pedido #{active.idPedido}
                                            </div>
                                        ) : (
                                            <div className="mt-1.5 text-[10px] sm:text-xs text-stone-500">Sin pedido</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section
                    className={classNames(
                        'space-y-4 lg:col-span-8',
                        !selectedId ? 'hidden lg:block' : '',
                    )}
                >
                    {!selectedId ? (
                        <div className="rounded-xl border border-stone-800 bg-stone-900 p-6 sm:p-8 text-center text-stone-400 text-sm">
                            Selecciona una mesa a la izquierda para tomar el pedido o ver la cuenta.
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setSelectedId(null)}
                                className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                                <span aria-hidden>←</span> Todas las mesas
                            </button>

                            <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-xs sm:text-sm text-stone-500">Mesa</div>
                                        <div className="text-xl sm:text-2xl font-semibold text-stone-50 truncate">
                                            {selectedMesa?.nombre || `Mesa ${selectedMesa?.numero}`}
                                        </div>
                                        <div className="text-xs text-stone-500 mt-1">Cap. {selectedMesa?.capacidad ?? '—'}</div>
                                    </div>
                                    {!pedido && !loadingPedido ? (
                                        selectedMesa?.pedido_activo?.bloqueado ? (
                                            <p className="text-sm text-amber-200/90 max-w-md">
                                                {selectedMesa.pedido_activo.mensaje || 'Pedido de otro mesero.'}
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={abrirCuenta}
                                                className="w-full sm:w-auto shrink-0 rounded-lg bg-orange-700 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-stone-50 focus-visible:ring-2 focus-visible:ring-amber-500"
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
                                        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                                            <span className="text-sm text-stone-400">Pedido #{pedido.idPedido}</span>
                                            <span className="rounded-full border border-stone-800 bg-stone-950 px-2.5 py-1 text-xs text-stone-200">
                                                {ESTADO_LABEL[pedido.estado] || pedido.estado}
                                            </span>
                                            <span className="text-sm text-stone-300 sm:ml-auto font-medium tabular-nums w-full sm:w-auto text-right sm:text-left">
                                                Subtotal {formatMoney(totalPedido)}
                                            </span>
                                        </div>
                                        {pedido.notas ? (
                                            <p className="text-sm text-stone-200 rounded-lg border border-stone-800 bg-stone-950 px-3 py-2">
                                                Nota mesa: {pedido.notas}
                                            </p>
                                        ) : null}
                                        <ul className="divide-y divide-stone-800 rounded-xl border border-stone-800 overflow-hidden">
                                            {pedido.detalles?.length ? (
                                                pedido.detalles.map((l) => (
                                                    <li key={l.idPedidoDetalle} className="px-3 py-2.5 flex gap-3 text-sm">
                                                        <span className="font-semibold text-amber-500/90 tabular-nums w-8 shrink-0">
                                                            {l.cantidad}×
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-stone-50 truncate">
                                                                {l.producto?.nombreProducto}
                                                            </div>
                                                            {l.nota ? <div className="text-xs text-stone-500">{l.nota}</div> : null}
                                                        </div>
                                                        <span className="text-stone-400 tabular-nums whitespace-nowrap shrink-0">
                                                            {formatMoney(Number(l.precio_unitario) * Number(l.cantidad))}
                                                        </span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-3 py-4 text-stone-500 text-sm text-center">Aún no hay ítems.</li>
                                            )}
                                        </ul>
                                        {pedido.estado === 'LISTO' ? (
                                            <div className="mt-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                                                <p className="text-xs text-stone-500 flex-1 min-w-0">
                                                    Cuando corresponda, cierra la cuenta para liberar la mesa.
                                                </p>
                                                <button
                                                    type="button"
                                                    disabled={cerrando}
                                                    onClick={cerrarCuenta}
                                                    className="rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
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
                                <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 sm:p-5">
                                    <h3 className="text-base sm:text-lg font-semibold text-stone-50 mb-3">Agregar al pedido</h3>

                                    <div className="relative mb-3">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" aria-hidden>
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="11" cy="11" r="7" />
                                                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                        <input
                                            type="search"
                                            enterKeyHint="search"
                                            autoComplete="off"
                                            value={busquedaMenu}
                                            onChange={(e) => setBusquedaMenu(e.target.value)}
                                            placeholder="Buscar plato, bebida, categoría…"
                                            className="w-full rounded-lg border border-stone-800 bg-stone-950 py-2.5 pl-10 pr-10 text-sm text-stone-50 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            aria-label="Buscar en el menú"
                                        />
                                        {busquedaMenu.trim() ? (
                                            <button
                                                type="button"
                                                onClick={() => setBusquedaMenu('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                                aria-label="Limpiar búsqueda"
                                            >
                                                Limpiar
                                            </button>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-stone-500 mb-3">
                                        {busquedaMenu.trim()
                                            ? `${totalFiltrado} resultado${totalFiltrado !== 1 ? 's' : ''} de ${totalCatalogo} productos`
                                            : `${totalCatalogo} productos en el menú`}
                                    </p>

                                    <div className="space-y-6 max-h-[min(65vh,520px)] overflow-y-auto pr-1 -mr-1">
                                        {totalFiltrado === 0 ? (
                                            <p className="text-sm text-stone-500 py-6 text-center rounded-lg border border-dashed border-stone-800 bg-stone-950/50 px-4">
                                                No hay productos que coincidan con «{busquedaMenu.trim()}». Prueba otra palabra o
                                                limpia el filtro.
                                            </p>
                                        ) : (
                                            catalogoPorCat.map(([cat, items]) => (
                                                <div key={cat}>
                                                    <div className="text-xs uppercase tracking-wide text-stone-500 mb-2">{cat}</div>
                                                    <ul className="space-y-2">
                                                        {items.map((p) => (
                                                            <li
                                                                key={p.idProducto}
                                                                className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-950 p-3"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-stone-50">{p.nombreProducto}</div>
                                                                    <div className="text-sm text-amber-500/90 tabular-nums mt-0.5">
                                                                        {formatMoney(p.precio)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-end">
                                                                    <label className="sr-only" htmlFor={`q-${p.idProducto}`}>
                                                                        Cantidad
                                                                    </label>
                                                                    <input
                                                                        id={`q-${p.idProducto}`}
                                                                        type="number"
                                                                        min={1}
                                                                        max={99}
                                                                        className={classNames(inputClass, 'w-full sm:w-16')}
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
                                                                        className={classNames(inputClass, 'flex-1 min-w-0 w-full sm:w-40')}
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
                                                                        className="rounded-lg bg-orange-700 hover:bg-orange-600 px-4 py-2 text-sm font-semibold text-stone-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 w-full sm:w-auto"
                                                                    >
                                                                        {addingId === p.idProducto ? '…' : 'Añadir'}
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </section>
            </div>

            <p className="text-center text-sm text-stone-500 pb-6 px-4">
                <Link to="/login-cocina" className="text-amber-600 hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 rounded">
                    Pantalla cocina
                </Link>
            </p>
        </div>
    );
}
