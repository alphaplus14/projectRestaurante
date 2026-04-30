import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginClientePage } from './pages/LoginClientePage';
import { BlankPage } from './pages/BlankPage';
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

