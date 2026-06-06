import React from 'react';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function IconShell({ className, children }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {children}
        </svg>
    );
}

export function MeseroRoleIcon({ className }) {
    return (
        <IconShell className={className}>
            <path d="M8 4h8" />
            <path d="M9 4v2.2a3 3 0 0 0 6 0V4" />
            <path d="M6 9h12" />
            <path d="M7 9v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9" />
            <path d="M10 13h4" />
        </IconShell>
    );
}

export function AdminRoleIcon({ className }) {
    return (
        <IconShell className={className}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </IconShell>
    );
}

export function CocinaRoleIcon({ className }) {
    return (
        <IconShell className={className}>
            <path d="M8 3v5" />
            <path d="M12 3v5" />
            <path d="M16 3v5" />
            <path d="M6 8c0 3 2 5 6 5s6-2 6-5" />
            <path d="M5 21h14" />
            <path d="M8 13v8" />
            <path d="M16 13v8" />
        </IconShell>
    );
}

export function CajeroRoleIcon({ className }) {
    return (
        <IconShell className={className}>
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 10h3" />
            <path d="M7 14h6" />
            <circle cx="17" cy="12" r="1.25" fill="currentColor" stroke="none" />
            <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
        </IconShell>
    );
}

const ROLE_ICONS = {
    MESERO: MeseroRoleIcon,
    ADMINISTRADOR: AdminRoleIcon,
    COCINERO: CocinaRoleIcon,
    CAJERO: CajeroRoleIcon,
};

export function StaffRoleIcon({ roleKey, className }) {
    const Icon = ROLE_ICONS[roleKey];
    if (!Icon) return null;
    return <Icon className={classNames('h-5 w-5', className)} />;
}
