import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
<<<<<<< HEAD
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
=======
import { isMasterHost } from './tenancy/tenantContext';
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
import { RequireCocina } from './auth/RequireCocina';
import { RequireMesero } from './auth/RequireMesero';
import { RequireCajero } from './auth/RequireCajero';
import { RequireAdmin } from './auth/RequireAdmin';
import { RequireCliente } from './auth/RequireCliente';
import { RequireMaster } from './auth/RequireMaster';
import { RequireMasterHost } from './auth/RequireMasterHost';
import { RequireOnboardingHost } from './auth/RequireOnboardingHost';
import { SessionHistoryGuard } from './auth/SessionHistoryGuard';

<<<<<<< HEAD
=======
// Code splitting: cada página se descarga solo cuando se navega a ella.
// lazyPage adapta los exports con nombre al default export que espera React.lazy.
function lazyPage(loader, name) {
    return React.lazy(() => loader().then((m) => ({ default: m[name] })));
}

const LoginClientePage = lazyPage(() => import('./pages/LoginClientePage'), 'LoginClientePage');
const LoginStaffPage = lazyPage(() => import('./pages/LoginStaffPage'), 'LoginStaffPage');
const AdminForgotPasswordPage = lazyPage(() => import('./pages/AdminForgotPasswordPage'), 'AdminForgotPasswordPage');
const AdminResetPasswordPage = lazyPage(() => import('./pages/AdminResetPasswordPage'), 'AdminResetPasswordPage');
const CocinaPedidosPage = lazyPage(() => import('./pages/CocinaPedidosPage'), 'CocinaPedidosPage');
const CocinaInventarioPage = lazyPage(() => import('./pages/CocinaInventarioPage'), 'CocinaInventarioPage');
const CocinaMenuPage = lazyPage(() => import('./pages/CocinaMenuPage'), 'CocinaMenuPage');
const MeseroSalonPage = lazyPage(() => import('./pages/MeseroSalonPage'), 'MeseroSalonPage');
const MeseroAjustesPage = lazyPage(() => import('./pages/MeseroAjustesPage'), 'MeseroAjustesPage');
const CajeroCajaPage = lazyPage(() => import('./pages/CajeroCajaPage'), 'CajeroCajaPage');
const CajeroAjustesPage = lazyPage(() => import('./pages/CajeroAjustesPage'), 'CajeroAjustesPage');
const CajeroFacturasPage = lazyPage(() => import('./pages/CajeroFacturasPage'), 'CajeroFacturasPage');
const AdminProductosPage = lazyPage(() => import('./pages/AdminProductosPage'), 'AdminProductosPage');
const AdminDashboardPage = lazyPage(() => import('./pages/AdminDashboardPage'), 'AdminDashboardPage');
const AdminMeserosPage = lazyPage(() => import('./pages/AdminMeserosPage'), 'AdminMeserosPage');
const AdminCocinerosPage = lazyPage(() => import('./pages/AdminCocinerosPage'), 'AdminCocinerosPage');
const AdminCajerosPage = lazyPage(() => import('./pages/AdminCajerosPage'), 'AdminCajerosPage');
const AdminConfiguracionPage = lazyPage(() => import('./pages/AdminConfiguracionPage'), 'AdminConfiguracionPage');
const AdminMesasPage = lazyPage(() => import('./pages/AdminMesasPage'), 'AdminMesasPage');
const AdminReservasPage = lazyPage(() => import('./pages/AdminReservasPage'), 'AdminReservasPage');
const AdminPlatosCanceladosPage = lazyPage(() => import('./pages/AdminPlatosCanceladosPage'), 'AdminPlatosCanceladosPage');
const AdminReportesPage = lazyPage(() => import('./pages/AdminReportesPage'), 'AdminReportesPage');
const AdminVentasPage = lazyPage(() => import('./pages/AdminVentasPage'), 'AdminVentasPage');
const AdminInventarioPage = lazyPage(() => import('./pages/AdminInventarioPage'), 'AdminInventarioPage');
const AdminFinanzasPage = lazyPage(() => import('./pages/AdminFinanzasPage'), 'AdminFinanzasPage');
const AdminUsuariosPage = lazyPage(() => import('./pages/AdminUsuariosPage'), 'AdminUsuariosPage');
const LandingPage = lazyPage(() => import('./pages/LandingPage'), 'LandingPage');
const MasterLoginPage = lazyPage(() => import('./pages/MasterLoginPage'), 'MasterLoginPage');
const MasterDashboardPage = lazyPage(() => import('./pages/MasterDashboardPage'), 'MasterDashboardPage');
const OnboardingPage = lazyPage(() => import('./pages/OnboardingPage'), 'OnboardingPage');
const ClienteCartaPage = lazyPage(() => import('./pages/ClienteCartaPage'), 'ClienteCartaPage');
const ClienteReservasPage = lazyPage(() => import('./pages/ClienteReservasPage'), 'ClienteReservasPage');
const ClienteOAuthCallbackPage = lazyPage(() => import('./pages/ClienteOAuthCallbackPage'), 'ClienteOAuthCallbackPage');
const TenantAccessBlockedPage = lazyPage(() => import('./pages/TenantAccessBlockedPage'), 'TenantAccessBlockedPage');

function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950">
            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                <span className="h-5 w-5 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" aria-hidden />
                <span className="text-sm">Cargando…</span>
            </div>
        </div>
    );
}

>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
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
        <SessionHistoryGuard>
<<<<<<< HEAD
=======
        <Suspense fallback={<PageLoader />}>
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
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
<<<<<<< HEAD
=======
        </Suspense>
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        </SessionHistoryGuard>
    );
}
