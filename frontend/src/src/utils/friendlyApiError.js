/**
 * Convierte respuestas de error de la API (Laravel, JSON, texto) en mensajes claros en español
 * para el usuario final, sin claves técnicas tipo validation.min.string.
 */

function isLikelyTranslationKey(s) {
    const t = String(s || '').trim();
    if (!t) return false;
    if (/^validation\.[a-z0-9_.]+$/i.test(t)) return true;
    if (/^[a-z][a-z0-9_.]*(\.[a-z][a-z0-9_]*)+$/i.test(t) && !/\s/.test(t)) return true;
    return false;
}

function isTechnicalNoise(s) {
    const t = String(s || '');
    return /SQLSTATE|Illuminate\\|Stack trace|Undefined array key/i.test(t);
}

const KEY_HINTS = [
    [/validation\.min\.string/i, 'Un texto es demasiado corto (por ejemplo la contraseña: mínimo 6 caracteres).'],
    [/validation\.max\.string/i, 'Un texto es demasiado largo para lo que permite el sistema.'],
    [/validation\.required/i, 'Falta completar un dato obligatorio.'],
    [/validation\.email/i, 'El correo electrónico no tiene un formato válido.'],
    [/validation\.unique/i, 'Ese valor ya está registrado (correo, cédula u otro campo único).'],
    [/validation\.boolean/i, 'Un campo de sí/no no es válido.'],
    [/validation\.in/i, 'Se eligió una opción no permitida en un desplegable o lista.'],
];

function translateOne(raw) {
    if (raw == null) return '';
    const s = String(raw).trim();
    if (!s) return '';

    if (isTechnicalNoise(s)) {
        return 'Ocurrió un problema en el servidor al guardar. Si persiste, avisa a soporte.';
    }

    if (isLikelyTranslationKey(s)) {
        for (const [re, msg] of KEY_HINTS) {
            if (re.test(s)) return msg;
        }
        return 'Los datos no pasaron la validación. Revisa el formulario e inténtalo de nuevo.';
    }

    const lower = s.toLowerCase();

    if (lower === 'the given data was invalid.' || lower === 'the given data was invalid') {
        return '';
    }

    if (/^este login es solo para /i.test(s)) {
        return s;
    }

    if (/must be at least\s+(\d+)\s+characters/i.test(s)) {
        const m = s.match(/must be at least\s+(\d+)\s+characters/i);
        const n = m ? m[1] : '6';
        return `Un campo requiere al menos ${n} caracteres (suele ser la contraseña).`;
    }

    if (/the\s+(.+?)\s+field\s+is\s+required/i.test(s)) {
        const m = s.match(/the\s+(.+?)\s+field\s+is\s+required/i);
        const field = m ? m[1].replace(/_/g, ' ') : 'un dato';
        return `Falta completar: ${field}.`;
    }

    if (/these credentials do not match our records|credenciales|unauthorized|unauthenticated/i.test(s)) {
        return 'Correo o contraseña incorrectos. Verifica e inténtalo de nuevo.';
    }

    if (/too many requests|429|throttle/i.test(s)) {
        return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
    }

    if (/^error\s*\d{3}$/i.test(s)) {
        return '';
    }

    return s;
}

function collectValidationMessages(errors) {
    if (!errors || typeof errors !== 'object') return [];
    const out = [];
    for (const v of Object.values(errors)) {
        if (Array.isArray(v)) {
            for (const x of v) {
                if (x != null) out.push(String(x));
            }
        } else if (v != null) {
            out.push(String(v));
        }
    }
    return out;
}

function dedupeLines(lines) {
    const seen = new Set();
    const out = [];
    for (const line of lines) {
        const t = line.trim();
        if (!t || seen.has(t)) continue;
        seen.add(t);
        out.push(t);
    }
    return out;
}

function statusFallback(status) {
    if (status === 401 || status === 403) {
        return 'No tienes permiso o la sesión expiró. Vuelve a iniciar sesión.';
    }
    if (status === 404) {
        return 'No se encontró el recurso solicitado.';
    }
    if (status === 409) {
        return 'Esa acción choca con datos ya existentes (duplicado o conflicto).';
    }
    if (status === 422) {
        return 'Los datos enviados no son válidos. Revisa el formulario.';
    }
    if (status === 429) {
        return 'Demasiadas peticiones. Espera unos segundos e inténtalo de nuevo.';
    }
    if (status >= 500) {
        return 'El servidor tuvo un problema. Inténtalo más tarde.';
    }
    if (status >= 400) {
        return 'No se pudo completar la acción. Revisa los datos e inténtalo de nuevo.';
    }
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
}

/**
 * @param {number} status HTTP status
 * @param {object|null} data Parsed JSON body or null
 * @param {string|null} rawText Plain text body when not JSON
 */
export function formatApiErrorForUser(status, data, rawText = null) {
    const lines = [];

    const fromErrors = collectValidationMessages(data?.errors)
        .map(translateOne)
        .filter(Boolean);
    lines.push(...fromErrors);

    const topRaw = data?.message ?? data?.error;
    if (topRaw != null && String(topRaw).trim()) {
        const t = translateOne(String(topRaw));
        if (t) lines.push(t);
    }

    if (rawText && typeof rawText === 'string') {
        const trimmed = rawText.trim();
        if (trimmed && trimmed.length < 600 && !trimmed.startsWith('<')) {
            const t = translateOne(trimmed);
            if (t) lines.push(t);
        }
    }

    const uniq = dedupeLines(lines);
    if (uniq.length > 0) {
        return uniq.join('\n');
    }

    return statusFallback(status || 0);
}
