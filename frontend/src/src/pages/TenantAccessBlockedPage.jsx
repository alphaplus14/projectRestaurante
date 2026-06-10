import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const COPY = {
    suspended: {
        title: 'Acceso desactivado',
        body: 'El acceso a este restaurante fue desactivado. Contacta al proveedor del software para reactivarlo.',
    },
    expired: {
        title: 'Licencia vencida',
        body: 'La licencia de este restaurante venció. Contacta al proveedor para renovar el acceso.',
    },
    default: {
        title: 'Acceso no disponible',
        body: 'Este restaurante no está disponible en este momento.',
    },
};

export function TenantAccessBlockedPage() {
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason') || 'default';
    const customMessage = searchParams.get('msg');
    const content = COPY[reason] ?? COPY.default;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <div className="max-w-lg w-full rounded-2xl border border-amber-200/60 dark:border-amber-400/20 bg-white dark:bg-neutral-900 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 text-2xl">
                    !
                </div>
                <h1 className="text-xl font-semibold tracking-tight">{content.title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-neutral-400">
                    {customMessage || content.body}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/cliente"
                        className="inline-flex items-center justify-center rounded-xl border border-stone-200 dark:border-white/10 px-5 py-2.5 text-sm font-medium hover:bg-stone-50 dark:hover:bg-white/5"
                    >
                        Volver al inicio
                    </Link>
                    <a
                        href="mailto:soporte@local.test"
                        className="inline-flex items-center justify-center rounded-xl bg-amber-400/90 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                    >
                        Contactar soporte
                    </a>
                </div>
            </div>
        </div>
    );
}
