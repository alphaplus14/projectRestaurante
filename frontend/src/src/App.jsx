import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginClientePage } from './pages/LoginClientePage';
import { LoginStaffPage } from './pages/LoginStaffPage';
import { AdminForgotPasswordPage } from './pages/AdminForgotPasswordPage';
import { AdminResetPasswordPage } from './pages/AdminResetPasswordPage';
import { CocinaPedidosPage } from './pages/CocinaPedidosPage';
import { CocinaInventarioPage } from './pages/CocinaInventarioPage';
import { CocinaMenuPage } from './pages/CocinaMenuPage';
import { MeseroSalonPage } from './pages/MeseroSalonPage';
import { MeseroAjustesPage } from './pages/MeseroAjustesPage';
import { CajeroCajaPage } from './pages/CajeroCajaPage';
import { CajeroAjustesPage } from './pages/CajeroAjustesPage';
import { CajeroFacturasPage } from './pages/CajeroFacturasPage';
import { AdminProductosPage } from './pages/AdminProductosPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminMeserosPage } from './pages/AdminMeserosPage';
import { AdminCocinerosPage } from './pages/AdminCocinerosPage';
import { AdminCajerosPage } from './pages/AdminCajerosPage';
import { AdminConfiguracionPage } from './pages/AdminConfiguracionPage';
import { AdminMesasPage } from './pages/AdminMesasPage';
import { AdminReservasPage } from './pages/AdminReservasPage';
import { AdminPlatosCanceladosPage } from './pages/AdminPlatosCanceladosPage';
import { AdminReportesPage } from './pages/AdminReportesPage';
import { AdminVentasPage } from './pages/AdminVentasPage';
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
import { ClienteOAuthCallbackPage } from './pages/ClienteOAuthCallbackPage';
import { TenantAccessBlockedPage } from './pages/TenantAccessBlockedPage';
import { RequireCocina } from './auth/RequireCocina';
import { RequireMesero } from './auth/RequireMesero';
import { RequireCajero } from './auth/RequireCajero';
import { RequireAdmin } from './auth/RequireAdmin';
import { RequireCliente } from './auth/RequireCliente';
import { RequireMaster } from './auth/RequireMaster';
import { RequireMasterHost } from './auth/RequireMasterHost';
import { RequireOnboardingHost } from './auth/RequireOnboardingHost';

function RootRedirect() {
    if (isMasterHost()) {
        return <Navigate to="/master" replace />;
    }
    return <Navigate to="/cliente" replace />;
}

function CatchAllRedirect() {
    if (isMasterHost()) {
        return <Navigate to="/master" replace />;
    }
    return <Navigate to="/cliente" replace />;
}

export function App() {
    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Plataforma Master + onboarding (hosts restringidos) */}
            <Route
                path="/master"
                element={
                    <RequireMasterHost>
                        <Navigate to="/master/login" replace />
                    </RequireMasterHost>
                }
            />
            <Route
                path="/master/login"
                element={
                    <RequireMasterHost>
                        <MasterLoginPage />
                    </RequireMasterHost>
                }
            />
            <Route
                path="/master/dashboard"
                element={
                    <RequireMasterHost>
                        <RequireMaster>
                            <MasterDashboardPage />
                        </RequireMaster>
                    </RequireMasterHost>
                }
            />
            <Route
                path="/onboarding/:token"
                element={
                    <RequireOnboardingHost>
                        <OnboardingPage />
                    </RequireOnboardingHost>
                }
            />

            {/* Sitio clientes (público + sesión cliente) */}
            <Route path="/cliente" element={<LandingPage />} />
            <Route path="/cliente/login" element={<LoginClientePage />} />
            <Route path="/cliente/oauth-callback" element={<ClienteOAuthCallbackPage />} />
            <Route path="/acceso-bloqueado" element={<TenantAccessBlockedPage />} />
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
            <Route path="/staff" element={<LoginStaffPage />} />
            <Route path="/staff/olvide-contrasena" element={<AdminForgotPasswordPage />} />
            <Route path="/restablecer-contrasena" element={<AdminResetPasswordPage />} />
            <Route path="/login-admin" element={<Navigate to="/staff?rol=admin" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/login-mesero" element={<Navigate to="/staff?rol=mesero" replace />} />
            <Route path="/login-cocina" element={<Navigate to="/staff?rol=cocina" replace />} />
            <Route path="/login-cajero" element={<Navigate to="/staff?rol=cajero" replace />} />
            <Route
                path="/mesero"
                element={
                    <RequireMesero>
                        <MeseroSalonPage />
                    </RequireMesero>
                }
            />
            <Route
                path="/mesero/ajustes"
                element={
                    <RequireMesero>
                        <MeseroAjustesPage />
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
                path="/cocina/inventario"
                element={
                    <RequireCocina>
                        <CocinaInventarioPage />
                    </RequireCocina>
                }
            />
            <Route
                path="/cocina/menu"
                element={
                    <RequireCocina>
                        <CocinaMenuPage />
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
                path="/cajero/ajustes"
                element={
                    <RequireCajero>
                        <CajeroAjustesPage />
                    </RequireCajero>
                }
            />
            <Route
                path="/cajero/facturas"
                element={
                    <RequireCajero>
                        <CajeroFacturasPage />
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
                path="/admin/platos-cancelados"
                element={
                    <RequireAdmin>
                        <AdminPlatosCanceladosPage />
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
                path="/admin/ventas"
                element={
                    <RequireAdmin>
                        <AdminVentasPage />
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

            <Route path="*" element={<CatchAllRedirect />} />
        </Routes>
    );
}
