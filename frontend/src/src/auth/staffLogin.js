export const STAFF_LOGIN_PATH = '/staff';

const ROL_QUERY = {
    admin: 'ADMINISTRADOR',
    mesero: 'MESERO',
    cocina: 'COCINERO',
};

const ROL_TO_QUERY = {
    ADMINISTRADOR: 'admin',
    MESERO: 'mesero',
    COCINERO: 'cocina',
};

export function staffLoginUrl(rolKey) {
    const q = ROL_TO_QUERY[rolKey];
    return q ? `${STAFF_LOGIN_PATH}?rol=${q}` : STAFF_LOGIN_PATH;
}

export function parseStaffRolFromQuery(searchParams) {
    const raw = (searchParams.get('rol') || '').toLowerCase();
    return ROL_QUERY[raw] ?? 'MESERO';
}
