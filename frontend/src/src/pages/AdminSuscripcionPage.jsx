import React from 'react';
import { Navigate } from 'react-router-dom';

/** Ruta legacy: la renovación vive en Configuración (#suscripcion). */
export function AdminSuscripcionPage() {
    return <Navigate to="/admin/configuracion#suscripcion" replace />;
}
