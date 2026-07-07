/** Calcula la nueva fecha de vencimiento al sumar meses (misma lógica que el backend). */
export function previewAccessExpiry(currentExpiresAt, months) {
    const now = new Date();
    let base = now;

    if (currentExpiresAt) {
        const current = new Date(currentExpiresAt);
        if (!Number.isNaN(current.getTime()) && current > now) {
            base = current;
        }
    }

    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    return next;
}

export function formatAccessDate(date) {
    if (!date || Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
