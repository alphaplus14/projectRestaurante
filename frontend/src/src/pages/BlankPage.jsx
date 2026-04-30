import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../auth/authStorage';

export function BlankPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
            <button
                type="button"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15"
                onClick={() => {
                    clearToken();
                    navigate('/login', { replace: true });
                }}
            >
                Cerrar sesión (demo)
            </button>
        </div>
    );
}

