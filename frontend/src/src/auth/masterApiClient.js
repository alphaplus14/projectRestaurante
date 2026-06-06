import { getMasterToken } from './masterAuthStorage';
import { formatApiErrorForUser } from '../utils/friendlyApiError';

export async function masterApiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body && !isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = getMasterToken();
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(path, { ...options, headers });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const dataObj = isJson && data && typeof data === 'object' ? data : null;
        const rawText = typeof data === 'string' ? data : null;
        const message = formatApiErrorForUser(res.status, dataObj, rawText);

        const err = new Error(message);
        err.status = res.status;
        err.data = dataObj;
        throw err;
    }

    return data;
}
