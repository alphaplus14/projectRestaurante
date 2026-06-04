const KEY = 'master_api_token';

export function getMasterToken() {
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
}

export function setMasterToken(token) {
    try {
        if (token) {
            localStorage.setItem(KEY, token);
        } else {
            localStorage.removeItem(KEY);
        }
    } catch {
        /* ignore */
    }
}

export function clearMasterToken() {
    setMasterToken(null);
}
