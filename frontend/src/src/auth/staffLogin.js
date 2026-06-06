export const STAFF_LOGIN_PATH = '/staff';

/** Orden pensado para uso diario: salón primero. */
export const STAFF_ROLE_ORDER = ['MESERO', 'ADMINISTRADOR', 'COCINERO', 'CAJERO'];

export const STAFF_ROLES = {
    MESERO: {
        key: 'MESERO',
        label: 'Mesero',
        subtitle: 'Salón',
        description: 'Pedidos, mesas y servicio en el restaurante.',
        short: 'M',
        query: 'mesero',
        endpoint: '/api/auth/login-mesero',
        redirect: '/mesero',
        submitLabel: 'Entrar al salón',
        ringClass: 'ring-emerald-500/60',
        selectedClass: 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/15',
        avatarClass: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-800 dark:text-emerald-200',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
    ADMINISTRADOR: {
        key: 'ADMINISTRADOR',
        label: 'Administrador',
        subtitle: 'Gestión',
        description: 'Menú, personal, reportes y configuración.',
        short: 'A',
        query: 'admin',
        endpoint: '/api/auth/login-admin',
        redirect: '/admin/dashboard',
        submitLabel: 'Entrar al panel',
        ringClass: 'ring-amber-500/60',
        selectedClass: 'border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15',
        avatarClass: 'bg-amber-600/20 border-amber-500/40 text-amber-900 dark:text-amber-200',
        iconClass: 'text-amber-600 dark:text-amber-400',
    },
    COCINERO: {
        key: 'COCINERO',
        label: 'Cocina',
        subtitle: 'Producción',
        description: 'Cola de pedidos y preparación de platos.',
        short: 'K',
        query: 'cocina',
        endpoint: '/api/auth/login-cocina',
        redirect: '/cocina',
        submitLabel: 'Entrar a cocina',
        ringClass: 'ring-orange-500/60',
        selectedClass: 'border-orange-500/50 bg-orange-500/10 dark:bg-orange-500/15',
        avatarClass: 'bg-orange-500/20 border-orange-400/40 text-orange-800 dark:text-orange-200',
        iconClass: 'text-orange-600 dark:text-orange-400',
    },
    CAJERO: {
        key: 'CAJERO',
        label: 'Cajero',
        subtitle: 'Caja',
        description: 'Cobros, cuentas y cierre de ventas.',
        short: 'C',
        query: 'cajero',
        endpoint: '/api/auth/login-cajero',
        redirect: '/cajero',
        submitLabel: 'Entrar a caja',
        ringClass: 'ring-sky-500/60',
        selectedClass: 'border-sky-500/50 bg-sky-500/10 dark:bg-sky-500/15',
        avatarClass: 'bg-sky-500/20 border-sky-400/40 text-sky-800 dark:text-sky-200',
        iconClass: 'text-sky-600 dark:text-sky-400',
    },
};

const ROL_QUERY = Object.fromEntries(
    Object.values(STAFF_ROLES).map((r) => [r.query, r.key]),
);

const ROL_TO_QUERY = Object.fromEntries(
    Object.values(STAFF_ROLES).map((r) => [r.key, r.query]),
);

// Las credenciales demo SOLO existen en desarrollo (Vite `import.meta.env.DEV`).
// En el build de producción quedan vacías y nunca se incluyen autocompletadas.
// Para personalizarlas en local, define VITE_DEMO_<ROL>_CORREO / _PASSWORD en .env.local.
const IS_DEV = Boolean(import.meta.env?.DEV);

function demoFromEnv(rolKey, correoFallback, passwordFallback) {
    const correo = import.meta.env?.[`VITE_DEMO_${rolKey}_CORREO`] ?? correoFallback;
    const password = import.meta.env?.[`VITE_DEMO_${rolKey}_PASSWORD`] ?? passwordFallback;
    return { correo, password };
}

const DEMO_CREDENTIALS = IS_DEV
    ? {
          ADMINISTRADOR: demoFromEnv('ADMINISTRADOR', 'admin@gmail.com', 'adminn'),
          MESERO: demoFromEnv('MESERO', 'mesero@gmail.com', 'meseroo'),
          COCINERO: demoFromEnv('COCINERO', 'cocinero@gmail.com', 'cocineroo'),
          CAJERO: demoFromEnv('CAJERO', 'cajero@gmail.com', 'cajeroo'),
      }
    : {};

export function staffLoginUrl(rolKey) {
    const q = ROL_TO_QUERY[rolKey];
    return q ? `${STAFF_LOGIN_PATH}?rol=${q}` : STAFF_LOGIN_PATH;
}

export function parseStaffRolFromQuery(searchParams) {
    const raw = (searchParams.get('rol') || '').toLowerCase();
    const key = ROL_QUERY[raw];
    return key && STAFF_ROLES[key] ? key : 'MESERO';
}

export function demoCredentialsForRol(rolKey, isTenantApp) {
    if (isTenantApp) {
        return { correo: '', password: '' };
    }
    return DEMO_CREDENTIALS[rolKey] ?? { correo: '', password: '' };
}
