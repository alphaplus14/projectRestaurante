import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginClientePage } from './pages/LoginClientePage';
import { LoginCocinaPage } from './pages/LoginCocinaPage';
import { LoginMeseroPage } from './pages/LoginMeseroPage';
import { CocinaPedidosPage } from './pages/CocinaPedidosPage';
import { MeseroSalonPage } from './pages/MeseroSalonPage';
import { BlankPage } from './pages/BlankPage';
import { RequireCocina } from './auth/RequireCocina';
import { RequireMesero } from './auth/RequireMesero';
import { getToken } from './auth/authStorage';

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

