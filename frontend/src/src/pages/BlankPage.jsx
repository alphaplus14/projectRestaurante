import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../auth/authStorage';
import { ThemeToggle } from '../theme/ThemeToggle';

export function BlankPage() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-stone-100 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100 flex flex-col items-center justify-center gap-6 px-4">
            <ThemeToggle />
            <button
                type="button"
                className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-white/10 dark:hover:bg-white/15 border border-stone-300 dark:border-white/15 text-stone-900 dark:text-neutral-100"
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

