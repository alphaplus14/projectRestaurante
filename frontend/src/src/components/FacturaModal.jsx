import React from 'react';
<<<<<<< HEAD
import { jsPDF } from 'jspdf';
=======
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235

function formatMoney(n) {
    const v = Number(n || 0);
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(v);
}

function formatFechaHora(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function nombreMesa(mesa) {
    if (!mesa) return '—';
    if (mesa.nombre) return mesa.nombre;
    if (mesa.numero != null) return `Mesa ${mesa.numero}`;
    return `Mesa #${mesa.idMesa}`;
}

function nombrePersona(p) {
    if (!p) return '—';
    return `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || '—';
}

/** Calcula el total recibido y la devolución, con respaldo por si la venta es antigua. */
function calcularMontos(factura) {
    const total = Number(factura.total || 0);
    const sumPagos = (factura.pagos || []).reduce((s, p) => s + Number(p.valor || 0), 0);
    const recibido = factura.recibido != null ? Number(factura.recibido) : sumPagos || total;
    const cambio = factura.cambio != null ? Number(factura.cambio) : Math.max(0, recibido - total);
    return { total, recibido, cambio };
}

/**
 * Genera la factura en PDF (formato tiquete 80mm) y la abre en una pestaña nueva
 * para visualizar/imprimir. Si el navegador bloquea la pestaña, la descarga.
 */
<<<<<<< HEAD
export function imprimirFactura(factura) {
    if (!factura) return;

=======
export async function imprimirFactura(factura) {
    if (!factura) return;

    // jspdf se carga bajo demanda: solo pesa en el navegador cuando se imprime.
    const { jsPDF } = await import('jspdf');

>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
    const r = factura.restaurante || {};
    const cancelada = factura.estado === 'CANCELADA';
    const items = factura.items || [];
    const pagos = factura.pagos || [];
    const { total, recibido, cambio } = calcularMontos(factura);

    const W = 80;
    const M = 6;
    const RIGHT = W - M;
    const alto = 150 + items.length * 6 + pagos.length * 5 + (cancelada ? 18 : 0);

    const doc = new jsPDF({ unit: 'mm', format: [W, Math.max(150, alto)] });
    let y = 10;

    const line = (dy = 4) => {
        y += dy;
    };
    const center = (text, size = 9, style = 'normal') => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.text(String(text), W / 2, y, { align: 'center' });
        line(size * 0.42 + 1.5);
    };
    const row = (left, right, size = 9, style = 'normal') => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.text(String(left), M, y);
        doc.text(String(right), RIGHT, y, { align: 'right' });
        line(size * 0.42 + 1.8);
    };
    const sep = () => {
        doc.setLineWidth(0.1);
        doc.setLineDashPattern([0.6, 0.6], 0);
        doc.line(M, y, RIGHT, y);
        doc.setLineDashPattern([], 0);
        line(3);
    };

    center(r.nombre_comercial || 'Restaurante', 12, 'bold');
    if (r.nit_o_documento) center(`NIT/Doc: ${r.nit_o_documento}`, 8);
    if (r.direccion) center(r.direccion, 8);
    if (r.telefono) center(`Tel: ${r.telefono}`, 8);
    line(1);
    sep();

    if (cancelada) {
        center('*** FACTURA ANULADA ***', 10, 'bold');
        line(1);
    }

    row('Factura', factura.numero_factura || `#${factura.idVenta}`, 9, 'bold');
    row('Fecha', formatFechaHora(factura.registrada_en), 8);
    row('Mesa', nombreMesa(factura.mesa), 8);
    row('Mesero', nombrePersona(factura.mesero), 8);
    row('Cajera', nombrePersona(factura.cajero), 8);
    sep();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Cant / Producto', M, y);
    doc.text('Importe', RIGHT, y, { align: 'right' });
    line(4);
    doc.setFont('helvetica', 'normal');

    items.forEach((it) => {
        const nombre = `${it.cantidad} x ${it.nombreProducto ?? 'Ítem'}`;
        const nombreCorto = nombre.length > 32 ? `${nombre.slice(0, 31)}…` : nombre;
        row(nombreCorto, formatMoney(it.importe), 8);
    });
    sep();

    row('Subtotal', formatMoney(factura.subtotal), 9);
    row('Propina / servicio', formatMoney(factura.impuesto_o_servicio), 9);
    row('TOTAL A PAGAR', formatMoney(total), 11, 'bold');
    line(1);
    row('Total recibido', formatMoney(recibido), 9);
    row('Devolución (vuelto)', formatMoney(cambio), 10, 'bold');
    sep();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Pagos', M, y);
    line(4);
    doc.setFont('helvetica', 'normal');
    pagos.forEach((p) => {
        const etiqueta = p.referencia ? `${p.metodo} (${p.referencia})` : p.metodo;
        row(etiqueta, formatMoney(p.valor), 8);
    });

    if (cancelada && factura.motivo_cancelacion) {
        sep();
        doc.setFontSize(8);
        const motivo = doc.splitTextToSize(`Motivo anulación: ${factura.motivo_cancelacion}`, W - M * 2);
        doc.text(motivo, M, y);
        line(motivo.length * 3.5);
    }

    line(3);
    center('¡Gracias por su visita!', 8);

    const nombreArchivo = `${factura.numero_factura || 'factura-' + factura.idVenta}.pdf`;
    try {
        const url = doc.output('bloburl');
        const win = window.open(url, '_blank');
        if (!win) doc.save(nombreArchivo);
    } catch {
        doc.save(nombreArchivo);
    }
}

export function FacturaModal({ open, factura, loading, error, onClose }) {
    if (!open) return null;

    const r = factura?.restaurante || {};
    const cancelada = factura?.estado === 'CANCELADA';
    const montos = factura ? calcularMontos(factura) : { total: 0, recibido: 0, cambio: 0 };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
                <div className="sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur px-5 py-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Factura</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-600/80 bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                    >
                        <span className="text-3xl font-light leading-none -mt-0.5" aria-hidden>
                            ×
                        </span>
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {loading ? (
                        <p className="text-sm text-stone-500 py-10 text-center">Cargando factura…</p>
                    ) : error ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    ) : !factura ? null : (
                        <>
                            <div className="text-center">
                                <div className="text-base font-semibold text-stone-900 dark:text-stone-50">
                                    {r.nombre_comercial || 'Restaurante'}
                                </div>
                                <div className="text-xs text-stone-500 space-y-0.5 mt-1">
                                    {r.nit_o_documento ? <div>NIT/Doc: {r.nit_o_documento}</div> : null}
                                    {r.direccion ? <div>{r.direccion}</div> : null}
                                    {r.telefono ? <div>Tel: {r.telefono}</div> : null}
                                </div>
                            </div>

                            {cancelada ? (
                                <div className="text-center">
                                    <span className="inline-flex rounded-full border border-red-400/60 text-red-700 dark:text-red-300 text-xs font-semibold px-3 py-0.5">
                                        FACTURA ANULADA
                                    </span>
                                </div>
                            ) : null}

                            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-3 text-sm space-y-1">
                                <div className="flex justify-between gap-3">
                                    <span className="text-stone-500">N.º factura</span>
                                    <span className="font-semibold tabular-nums">{factura.numero_factura || `#${factura.idVenta}`}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-stone-500">Fecha y hora</span>
                                    <span className="tabular-nums">{formatFechaHora(factura.registrada_en)}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-stone-500">Mesa</span>
                                    <span>{nombreMesa(factura.mesa)}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-stone-500">Mesero</span>
                                    <span>{nombrePersona(factura.mesero)}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-stone-500">Cajera</span>
                                    <span>{nombrePersona(factura.cajero)}</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-stone-100 dark:bg-stone-800/60 text-xs uppercase text-stone-500">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium">Producto</th>
                                            <th className="text-right px-2 py-2 font-medium">Cant</th>
                                            <th className="text-right px-3 py-2 font-medium">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                        {(factura.items || []).map((it) => (
                                            <tr key={it.idPedidoDetalle}>
                                                <td className="px-3 py-2 text-stone-800 dark:text-stone-200">{it.nombreProducto}</td>
                                                <td className="px-2 py-2 text-right tabular-nums">{it.cantidad}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(it.importe)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-3 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Subtotal</span>
                                    <span className="tabular-nums">{formatMoney(factura.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Propina / servicio</span>
                                    <span className="tabular-nums">{formatMoney(factura.impuesto_o_servicio)}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-stone-200 dark:border-stone-800">
                                    <span className="font-semibold text-stone-900 dark:text-stone-50">Total a pagar</span>
                                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                                        {formatMoney(montos.total)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Total recibido</span>
                                    <span className="tabular-nums">{formatMoney(montos.recibido)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-amber-700 dark:text-amber-300">Devolución (vuelto)</span>
                                    <span className="font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                                        {formatMoney(montos.cambio)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(factura.pagos || []).map((p) => (
                                    <span
                                        key={p.idPago}
                                        className="inline-flex rounded-full border border-stone-200 dark:border-stone-700 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-400"
                                    >
                                        {p.metodo}: {formatMoney(p.valor)}
                                    </span>
                                ))}
                            </div>

                            {cancelada && factura.motivo_cancelacion ? (
                                <p className="text-xs text-red-800 dark:text-red-200 border-t border-red-200 dark:border-red-900/50 pt-2">
                                    <span className="font-semibold">Motivo anulación: </span>
                                    {factura.motivo_cancelacion}
                                </p>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => imprimirFactura(factura)}
                                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 text-sm"
                            >
                                Imprimir factura (PDF)
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
