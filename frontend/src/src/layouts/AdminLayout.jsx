import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function usePersistedBoolean(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return initialValue;
            return raw === '1';
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, value ? '1' : '0');
        } catch {
            // ignore
        }
    }, [key, value]);

    return [value, setValue];
}

function marcaInicial(nombre) {
    const t = String(nombre ?? '').trim();
    if (!t) return 'Ñ';
    return t.slice(0, 1).toUpperCase();
}

function sidebarDotClass(to) {
    if (to.includes('/configuracion')) return 'bg-stone-500';
    if (to.includes('/reservas')) return 'bg-teal-600';
    if (to.includes('/productos') || to.includes('/cocineros')) return 'bg-orange-600';
    if (to.includes('/usuarios') || to.includes('/reportes') || to.includes('/inventario') || to.includes('/finanzas')) {
        return 'bg-amber-500';
    }
    return 'bg-amber-500';
}

function SidebarItem({ to, label, collapsed }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                classNames(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    isActive ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-50' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:text-stone-50',
                )
            }
            title={collapsed ? label : undefined}
        >
            <span className={classNames('h-2.5 w-2.5 rounded-full shrink-0', sidebarDotClass(to))} />
            <span className={classNames('truncate', collapsed ? 'hidden' : 'block')}>{label}</span>
        </NavLink>
    );
}

export function AdminLayout({ title, children }) {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = usePersistedBoolean('admin_sidebar_collapsed', false);
    const [marcaNombre, setMarcaNombre] = useState('Ñapa');
    const [marcaLogo, setMarcaLogo] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadMarca() {
            try {
                const res = await apiFetch('/api/admin/restaurante-config');
                const d = res?.data;
                if (cancelled || !d) return;
                setMarcaNombre(d.nombre_comercial?.trim() || 'Ñapa');
                setMarcaLogo(d.logoUrl || null);
            } catch {
                if (!cancelled) {
                    setMarcaNombre('Ñapa');
                    setMarcaLogo(null);
                }
            }
        }

        loadMarca();
        const onActualizada = () => {
            void loadMarca();
        };
        window.addEventListener('napa:config-actualizada', onActualizada);
        return () => {
            cancelled = true;
            window.removeEventListener('napa:config-actualizada', onActualizada);
        };
    }, []);

    const sidebarWidth = useMemo(() => (collapsed ? 'w-20' : 'w-72'), [collapsed]);

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
            <div className="flex min-h-screen">
                <aside className={classNames('shrink-0 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900', sidebarWidth)}>
                    <div className="h-16 px-4 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
                        <div className={classNames('flex items-center gap-3 min-w-0', collapsed ? 'justify-center w-full' : '')}>
                            {marcaLogo ? (
                                <img
                                    src={marcaLogo}
                                    alt=""
                                    className={classNames(
                                        'rounded-xl object-cover border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 shrink-0',
                                        collapsed ? 'h-10 w-10' : 'h-9 w-9',
                                    )}
                                />
                            ) : (
                                <div
                                    className={classNames(
                                        'rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center font-semibold text-amber-900 dark:text-amber-200 shrink-0',
                                        collapsed ? 'h-10 w-10 text-base' : 'h-9 w-9 text-sm',
                                    )}
                                >
                                    {marcaInicial(marcaNombre)}
                                </div>
                            )}
                            <div className={classNames('min-w-0', collapsed ? 'hidden' : 'block')}>
                                <div className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">{marcaNombre}</div>
                                <div className="text-xs text-stone-600 dark:text-stone-400">Administrador</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setCollapsed((v) => !v)}
                            className={classNames(
                                'rounded-lg p-2 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60',
                                'focus-visible:ring-2 focus-visible:ring-amber-500',
                                collapsed ? 'hidden' : 'block',
                            )}
                            type="button"
                            aria-label="Contraer sidebar"
                            title="Contraer"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-3 space-y-1">
                        {collapsed ? (
                            <button
                                onClick={() => setCollapsed(false)}
                                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
                                type="button"
                                aria-label="Expandir sidebar"
                                title="Expandir"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        ) : null}

                        <SidebarItem to="/admin/dashboard" label="Dashboard" collapsed={collapsed} />
                        <SidebarItem to="/admin/mesas" label="Mesas" collapsed={collapsed} />
                        <SidebarItem to="/admin/reservas" label="Reservas" collapsed={collapsed} />
                        <SidebarItem to="/admin/productos" label="Productos" collapsed={collapsed} />
                        <SidebarItem to="/admin/meseros" label="Meseros" collapsed={collapsed} />
                        <SidebarItem to="/admin/cocineros" label="Cocineros" collapsed={collapsed} />
                        <SidebarItem to="/admin/cajeros" label="Cajeros" collapsed={collapsed} />
                        <SidebarItem to="/admin/reportes" label="Reportes" collapsed={collapsed} />
                        <SidebarItem to="/admin/inventario" label="Inventario" collapsed={collapsed} />
                        <SidebarItem to="/admin/finanzas" label="Finanzas" collapsed={collapsed} />
                        <SidebarItem to="/admin/usuarios" label="Usuarios" collapsed={collapsed} />
                        <SidebarItem to="/admin/configuracion" label="Configuración" collapsed={collapsed} />
                    </div>
                </aside>

                <main className="flex-1">
                    <div className="h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 gap-4">
                        <div className="text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <ThemeToggle />
                            <button
                                type="button"
                                onClick={() => {
                                    clearToken();
                                    navigate('/login-admin', { replace: true });
                                }}
                                className={classNames(
                                    'rounded-lg border border-stone-200 dark:border-stone-800',
                                    'px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200',
                                    'hover:bg-stone-100 dark:hover:bg-stone-800/60',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap',
                                )}
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-10">{children}</div>
                </main>
            </div>
        </div>
    );
}
