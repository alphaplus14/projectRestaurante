import React from 'react';
import { Link } from 'react-router-dom';
import { ClienteLoginPanel } from '../components/ClienteLoginPanel';
<<<<<<< HEAD
=======
import { RestarantinoLogo } from '../components/RestarantinoLogo';
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
import { ThemeToggle } from '../theme/ThemeToggle';

export function LoginClientePage() {
    return (
        <div className="relative min-h-screen overflow-x-clip bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.20),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.18),transparent_60%)]" />

            <div className="relative mx-auto max-w-6xl px-4 min-[375px]:px-5 sm:px-6 pt-16 sm:pt-20 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))] min-h-screen flex flex-col justify-center">
                <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10 flex flex-wrap items-center justify-end gap-2 sm:gap-3 max-w-[calc(100%-1rem)]">
                    <Link
                        to="/cliente"
                        className="text-xs sm:text-sm text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-300 shrink-0 touch-manipulation"
                        aria-label="Volver al inicio cliente"
                    >
                        <span aria-hidden className="sm:hidden">
                            ← Inicio
                        </span>
                        <span className="hidden sm:inline">← Volver al inicio</span>
                    </Link>
                    <ThemeToggle />
                </div>
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-center min-w-0">
                    <div className="min-w-0 order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1 text-xs sm:text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                            Acceso clientes
                        </div>

<<<<<<< HEAD
                        <h1 className="mt-4 text-3xl min-[380px]:text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900 dark:text-neutral-50 break-words">
                            Bienvenido a{' '}
                            <span className="text-amber-700 dark:text-amber-300">Proyecto Restaurante</span>
                        </h1>
=======
                        <div className="mt-4">
                            <RestarantinoLogo size="lg" className="max-w-[min(100%,16rem)]" />
                        </div>
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
                        <p className="mt-4 text-sm sm:text-base text-stone-700 dark:text-neutral-300 leading-relaxed max-w-prose">
                            La carta del menú la puedes ver sin cuenta desde el inicio. Crea una cuenta o inicia sesión para reservar mesa.
                        </p>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md mx-auto lg:mx-0 lg:max-w-none order-1 lg:order-2 min-w-0">
                        <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-white/5 p-4 sm:p-6 shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
                            <ClienteLoginPanel subtitle="Cliente" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
