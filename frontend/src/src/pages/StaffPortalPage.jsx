import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../theme/ThemeToggle';

/**
 * Punto de entrada para el personal: sin branding de clientes.
 */
export function StaffPortalPage() {
    return (
        <div className="relative min-h-screen bg-stone-200 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-80 bg-[radial-gradient(ellipse_at_top,rgba(87,83,78,0.25),transparent_50%)]" />

            <header className="relative border-b border-stone-300 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md">
                <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-neutral-500">Restaurante</div>
                        <h1 className="text-lg font-semibold text-stone-900 dark:text-neutral-50">Portal del personal</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="relative mx-auto max-w-3xl px-5 py-12">
                <p className="text-stone-600 dark:text-neutral-400 text-sm leading-relaxed mb-8">
                    Accesos internos. Si llegaste aquí por error, el sitio para comensales está aparte.
                </p>

                <ul className="space-y-3">
                    <li>
                        <Link
                            to="/login-admin"
                            className="flex items-center justify-between rounded-xl border border-stone-300 dark:border-white/10 bg-white dark:bg-neutral-900/60 px-4 py-4 hover:bg-stone-50 dark:hover:bg-neutral-800/80 transition-colors"
                        >
                            <span className="font-medium text-stone-900 dark:text-neutral-50">Administración</span>
                            <span className="text-xs text-amber-700 dark:text-amber-400">Panel admin</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/login-mesero"
                            className="flex items-center justify-between rounded-xl border border-stone-300 dark:border-white/10 bg-white dark:bg-neutral-900/60 px-4 py-4 hover:bg-stone-50 dark:hover:bg-neutral-800/80 transition-colors"
                        >
                            <span className="font-medium text-stone-900 dark:text-neutral-50">Meseros</span>
                            <span className="text-xs text-emerald-700 dark:text-emerald-400">Salón</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/login-cocina"
                            className="flex items-center justify-between rounded-xl border border-stone-300 dark:border-white/10 bg-white dark:bg-neutral-900/60 px-4 py-4 hover:bg-stone-50 dark:hover:bg-neutral-800/80 transition-colors"
                        >
                            <span className="font-medium text-stone-900 dark:text-neutral-50">Cocina</span>
                            <span className="text-xs text-orange-700 dark:text-orange-400">Pedidos</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/login-cajero"
                            className="flex items-center justify-between rounded-xl border border-stone-300 dark:border-white/10 bg-white dark:bg-neutral-900/60 px-4 py-4 hover:bg-stone-50 dark:hover:bg-neutral-800/80 transition-colors"
                        >
                            <span className="font-medium text-stone-900 dark:text-neutral-50">Caja</span>
                            <span className="text-xs text-blue-700 dark:text-blue-400">Cobro</span>
                        </Link>
                    </li>
                </ul>

                <p className="mt-10 text-center text-sm text-stone-600 dark:text-neutral-500">
                    <Link to="/cliente" className="text-stone-800 dark:text-neutral-300 hover:underline">
                        Ir al sitio para clientes
                    </Link>
                </p>
            </main>
        </div>
    );
}
