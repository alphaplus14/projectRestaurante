import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

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

function SidebarItem({ to, label, collapsed }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                classNames(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    isActive ? 'bg-stone-800 text-stone-50' : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-50',
                )
            }
            title={collapsed ? label : undefined}
        >
            <span
                className={classNames(
                    'h-2.5 w-2.5 rounded-full',
                    to.includes('/productos') ? 'bg-orange-600' : to.includes('/cocineros') ? 'bg-orange-600' : 'bg-amber-500',
                )}
            />
            <span className={classNames('truncate', collapsed ? 'hidden' : 'block')}>{label}</span>
        </NavLink>
    );
}

export function AdminLayout({ title, children }) {
    const [collapsed, setCollapsed] = usePersistedBoolean('admin_sidebar_collapsed', false);

    const sidebarWidth = useMemo(() => (collapsed ? 'w-20' : 'w-72'), [collapsed]);

    return (
        <div className="min-h-screen bg-stone-950 text-stone-50">
            <div className="flex min-h-screen">
                <aside className={classNames('shrink-0 border-r border-stone-800 bg-stone-900', sidebarWidth)}>
                    <div className="h-16 px-4 flex items-center justify-between border-b border-stone-800">
                        <div className={classNames('flex items-center gap-3', collapsed ? 'justify-center w-full' : '')}>
                            <div className="h-9 w-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center font-semibold text-amber-200">
                                Ñ
                            </div>
                            <div className={classNames(collapsed ? 'hidden' : 'block')}>
                                <div className="text-sm font-semibold">Ñapa</div>
                                <div className="text-xs text-stone-400">Administrador</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setCollapsed((v) => !v)}
                            className={classNames(
                                'rounded-lg p-2 border border-stone-800 text-stone-200 hover:bg-stone-800/60',
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
                                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-stone-800 text-stone-200 hover:bg-stone-800/60 focus-visible:ring-2 focus-visible:ring-amber-500"
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
                        <SidebarItem to="/admin/productos" label="Productos" collapsed={collapsed} />
                        <SidebarItem to="/admin/meseros" label="Meseros" collapsed={collapsed} />
                        <SidebarItem to="/admin/cocineros" label="Cocineros" collapsed={collapsed} />
                    </div>
                </aside>

                <main className="flex-1">
                    <div className="h-16 border-b border-stone-800 flex items-center justify-between px-6">
                        <div className="text-lg font-semibold">{title}</div>
                        <div className="text-sm text-stone-400">Panel admin</div>
                    </div>

                    <div className="px-6 py-10">{children}</div>
                </main>
            </div>
        </div>
    );
}

