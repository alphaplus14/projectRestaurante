import React from 'react';
import { MasterTwoFactorPanel } from './MasterTwoFactorPanel';

export function MasterSecurityPanel({ onLogout }) {
    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <h2 className="font-semibold text-lg">Sesión</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Cierra la sesión Master en este navegador. Para reactivar la suscripción de un cliente, usa la
                    pestaña Clientes y extiende meses de licencia.
                </p>
                <button
                    type="button"
                    onClick={onLogout}
                    className="mt-4 rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2.5 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-950"
                >
                    Cerrar sesión Master
                </button>
            </section>

            <MasterTwoFactorPanel />
        </div>
    );
}
