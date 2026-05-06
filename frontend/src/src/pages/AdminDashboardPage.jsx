import React from 'react';
import { AdminLayout } from '../layouts/AdminLayout';

export function AdminDashboardPage() {
    return (
        <AdminLayout title="Dashboard">
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                <div className="text-stone-50 font-semibold">Bienvenido</div>
                <div className="mt-2 text-stone-400">
                    Desde aquí podrás ver métricas y accesos rápidos. (Pendiente de conectar a API de reportes/ventas).
                </div>
            </div>
        </AdminLayout>
    );
}

