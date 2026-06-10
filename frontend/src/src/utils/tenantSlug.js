const EMOJI_RE = /\p{Extended_Pictographic}/u;
const RESERVED = new Set(['master', 'www', 'api', 'onboarding', 'mail', 'admin', 'app']);

/**
 * Normaliza para URL/subdominio: ñ→n, quita acentos, solo a-z0-9 y guiones.
 */
export function normalizeTenantSlug(raw) {
    let s = String(raw ?? '').trim().toLowerCase();

    s = s
        .replace(/ñ/g, 'n')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    s = s.replace(/[^a-z0-9-]+/g, '-');
    s = s.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

    return s;
}

/**
 * @returns {{ ok: boolean, normalized: string, error: string, hint: string }}
 */
export function validateTenantSlugInput(raw, { min = 2, max = 40 } = {}) {
    const input = String(raw ?? '').trim();
    const normalized = normalizeTenantSlug(input);

    if (!input) {
        return { ok: false, normalized: '', error: '', hint: '' };
    }

    if (EMOJI_RE.test(input)) {
        return {
            ok: false,
            normalized,
            error: 'No se permiten emojis en el subdominio.',
            hint: 'Usa solo letras, números y guiones.',
        };
    }

    if (/\s/.test(input)) {
        return {
            ok: false,
            normalized,
            error: 'No uses espacios.',
            hint: 'Ejemplo: mi-restaurante o ñapita (la ñ se convierte en n).',
        };
    }

    if (/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ-]/.test(input)) {
        return {
            ok: false,
            normalized,
            error: 'Caracteres no permitidos (símbolos como @, #, %, /, etc.).',
            hint: 'Solo letras (incluida ñ), números y guiones.',
        };
    }

    if (/-{2,}/.test(input) || input.startsWith('-') || input.endsWith('-')) {
        return {
            ok: false,
            normalized,
            error: 'Los guiones no pueden ir al inicio, al final ni repetidos.',
            hint: 'Ejemplo válido: cafe-del-centro',
        };
    }

    if (normalized.length < min) {
        return {
            ok: false,
            normalized,
            error: `Mínimo ${min} caracteres después de normalizar.`,
            hint: normalized ? `Quedaría: ${normalized}` : 'Escribe un nombre más largo.',
        };
    }

    if (normalized.length > max) {
        return {
            ok: false,
            normalized: normalized.slice(0, max),
            error: `Máximo ${max} caracteres en la URL.`,
            hint: 'Acorta el nombre del subdominio.',
        };
    }

    if (RESERVED.has(normalized)) {
        return {
            ok: false,
            normalized,
            error: `“${normalized}” está reservado y no puede usarse.`,
            hint: 'Elige otro nombre para el restaurante.',
        };
    }

    const hint =
        normalized !== input.toLowerCase().replace(/\s+/g, '-')
            ? `URL del cliente: ${normalized}`
            : '';

    return { ok: true, normalized, error: '', hint };
}
