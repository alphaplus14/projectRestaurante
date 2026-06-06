import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginClientePage } from './pages/LoginClientePage';
import { LoginCocinaPage } from './pages/LoginCocinaPage';
import { LoginMeseroPage } from './pages/LoginMeseroPage';
import { LoginCajeroPage } from './pages/LoginCajeroPage';
import { LoginAdminPage } from './pages/LoginAdminPage';
import { StaffPortalPage } from './pages/StaffPortalPage';
import { CocinaPedidosPage } from './pages/CocinaPedidosPage';
import { MeseroSalonPage } from './pages/MeseroSalonPage';
import { CajeroCajaPage } from './pages/CajeroCajaPage';
import { AdminProductosPage } from './pages/AdminProductosPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminMeserosPage } from './pages/AdminMeserosPage';
import { AdminCocinerosPage } from './pages/AdminCocinerosPage';
import { AdminCajerosPage } from './pages/AdminCajerosPage';
import { AdminConfiguracionPage } from './pages/AdminConfiguracionPage';
import { AdminMesasPage } from './pages/AdminMesasPage';
import { AdminReservasPage } from './pages/AdminReservasPage';
import { AdminReportesPage } from './pages/AdminReportesPage';
import { AdminInventarioPage } from './pages/AdminInventarioPage';
import { AdminFinanzasPage } from './pages/AdminFinanzasPage';
import { AdminUsuariosPage } from './pages/AdminUsuariosPage';
import { LandingPage } from './pages/LandingPage';
import { MasterLoginPage } from './pages/MasterLoginPage';
import { MasterDashboardPage } from './pages/MasterDashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { isMasterHost } from './tenancy/tenantContext';
import { ClienteCartaPage } from './pages/ClienteCartaPage';
import { ClienteReservasPage } from './pages/ClienteReservasPage';
import { RequireCocina } from './auth/RequireCocina';
import { RequireMesero } from './auth/RequireMesero';
import { RequireCajero } from './auth/RequireCajero';
import { RequireAdmin } from './auth/RequireAdmin';
import { RequireCliente } from './auth/RequireCliente';
import { RequireMaster } from './auth/RequireMaster';

function RootRedirect() {
    if (isMasterHost()) {
        return <Navigate to="/master" replace />;
    }
    return <Navigate to="/cliente" replace />;
}

export function App() {
    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Plataforma Master + onboarding (sin subdominio de tenant) */}
            <Route path="/master" element={<Navigate to="/master/login" replace />} />
            <Route path="/master/login" element={<MasterLoginPage />} />
            <Route
                path="/master/dashboard"
                element={
                    <RequireMaster>
                        <MasterDashboardPage />
                    </RequireMaster>
                }
            />
            <Route path="/onboarding/:token" element={<OnboardingPage />} />

            {/* Sitio clientes (público + sesión cliente) */}
            <Route path="/cliente" element={<LandingPage />} />
            <Route path="/cliente/login" element={<LoginClientePage />} />
            <Route path="/login" element={<Navigate to="/cliente/login" replace />} />
            <Route path="/blank" element={<Navigate to="/cliente/carta" replace />} />
            <Route path="/cliente/carta" element={<ClienteCartaPage />} />
            <Route
                path="/cliente/reservas"
                element={
                    <RequireCliente>
                        <ClienteReservasPage />
                    </RequireCliente>
                }
            />

            {/* Personal del restaurante */}
            <Route path="/staff" element={<StaffPortalPage />} />
            <Route path="/login-admin" element={<LoginAdminPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/login-mesero" element={<LoginMeseroPage />} />
            <Route path="/login-cocina" element={<LoginCocinaPage />} />
            <Route path="/login-cajero" element={<LoginCajeroPage />} />
            <Route
                path="/mesero"
                element={
                    <RequireMesero>
                        <MeseroSalonPage />
                    </RequireMesero>
                }
            />
            <Route
                path="/cocina"
                element={
                    <RequireCocina>
                        <CocinaPedidosPage />
                    </RequireCocina>
                }
            />
            <Route
                path="/cajero"
                element={
                    <RequireCajero>
                        <CajeroCajaPage />
                    </RequireCajero>
                }
            />
            <Route
                path="/admin/dashboard"
                element={
                    <RequireAdmin>
                        <AdminDashboardPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/mesas"
                element={
                    <RequireAdmin>
                        <AdminMesasPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/reservas"
                element={
                    <RequireAdmin>
                        <AdminReservasPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/productos"
                element={
                    <RequireAdmin>
                        <AdminProductosPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/meseros"
                element={
                    <RequireAdmin>
                        <AdminMeserosPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/cocineros"
                element={
                    <RequireAdmin>
                        <AdminCocinerosPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/cajeros"
                element={
                    <RequireAdmin>
                        <AdminCajerosPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/reportes"
                element={
                    <RequireAdmin>
                        <AdminReportesPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/inventario"
                element={
                    <RequireAdmin>
                        <AdminInventarioPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/finanzas"
                element={
                    <RequireAdmin>
                        <AdminFinanzasPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/usuarios"
                element={
                    <RequireAdmin>
                        <AdminUsuariosPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/admin/configuracion"
                element={
                    <RequireAdmin>
                        <AdminConfiguracionPage />
                    </RequireAdmin>
                }
            />

            <Route path="*" element={<Navigate to="/cliente" replace />} />
        </Routes>
    );
}
