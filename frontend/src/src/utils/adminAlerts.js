import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** SweetAlert2 con estética del panel admin (dark + CTA naranja). */
export function adminSwalMixin(partial = {}) {
    return Swal.mixin({
        background: '#1c1917',
        color: '#fafaf9',
        confirmButtonColor: '#c2410c',
        cancelButtonColor: '#44403c',
        buttonsStyling: true,
        customClass: {
            popup: 'rounded-xl border border-stone-800',
            title: 'text-stone-50',
            htmlContainer: 'text-stone-300 text-left',
        },
        ...partial,
    });
}

/**
 * Muestra un error amigable al administrador (SweetAlert2).
 * @param {Error & { status?: number, data?: object }} err Error lanzado por apiFetch u otro fetch
 * @param {string} [title='Algo salió mal'] Título contextual
 */
export function adminAlertError(err, title = 'Algo salió mal') {
    const swal = adminSwalMixin();
    const raw = typeof err?.message === 'string' ? err.message.trim() : '';
    const text =
        raw ||
        'No se pudo completar la acción. Revisa tu conexión o vuelve a intentarlo en unos segundos.';

    const parts = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const html =
        parts.length > 1
            ? `<ul class="text-left text-sm text-stone-300 list-disc pl-5 space-y-1">${parts
                  .map((l) => `<li>${escapeHtml(l)}</li>`)
                  .join('')}</ul>`
            : null;

    return swal.fire({
        icon: 'error',
        title,
        ...(html ? { html } : { text }),
        confirmButtonText: 'Entendido',
    });
}

export function adminAlertSuccess(title, text) {
    const swal = adminSwalMixin();
    return swal.fire({
        icon: 'success',
        title,
        text: text || undefined,
        confirmButtonText: 'Listo',
    });
}
