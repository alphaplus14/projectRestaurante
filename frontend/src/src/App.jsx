import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginClientePage } from './pages/LoginClientePage';
import { LoginCocinaPage } from './pages/LoginCocinaPage';
import { LoginMeseroPage } from './pages/LoginMeseroPage';
import { LoginAdminPage } from './pages/LoginAdminPage';
import { CocinaPedidosPage } from './pages/CocinaPedidosPage';
import { MeseroSalonPage } from './pages/MeseroSalonPage';
import { AdminProductosPage } from './pages/AdminProductosPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminMeserosPage } from './pages/AdminMeserosPage';
import { AdminCocinerosPage } from './pages/AdminCocinerosPage';
import { AdminMesasPage } from './pages/AdminMesasPage';
import { BlankPage } from './pages/BlankPage';
import { RequireCocina } from './auth/RequireCocina';
import { RequireMesero } from './auth/RequireMesero';
import { RequireAdmin } from './auth/RequireAdmin';
import { getToken } from './auth/authStorage';
import { AdminReportesPage } from "./pages/AdminReportesPage";
import { AdminInventarioPage } from "./pages/AdminInventarioPage";
import { AdminFinanzasPage } from "./pages/AdminFinanzasPage";

function RequireAuth({ children }) {
    const token = getToken();
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

export function App() {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login-cocina" element={<LoginCocinaPage />} />
        <Route path="/login-mesero" element={<LoginMeseroPage />} />
        <Route path="/login-admin" element={<LoginAdminPage />} />
        <Route
          path="/admin/finanzas"
          element={
            <RequireAdmin>
              <AdminFinanzasPage />
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
          path="/admin/productos"
          element={
            <RequireAdmin>
              <AdminProductosPage />
            </RequireAdmin>
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
        <Route path="/login" element={<LoginClientePage />} />
        <Route
          path="/blank"
          element={
            <RequireAuth>
              <BlankPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
}

