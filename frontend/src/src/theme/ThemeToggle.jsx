import React from 'react';
import { useTheme } from './ThemeProvider';

function SunIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
            <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
    );
}

function MoonIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
            <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                fill="currentColor"
                fillOpacity="0.15"
            />
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={[
                'group relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                isDark
                    ? 'border-stone-600/80 bg-stone-800/90 text-amber-400 shadow-inner hover:border-stone-500 hover:bg-stone-700 hover:text-amber-300 focus-visible:ring-offset-stone-950 active:scale-95'
                    : 'border-stone-300/90 bg-white text-amber-600 shadow-md shadow-stone-300/50 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-lg hover:shadow-amber-200/40 focus-visible:ring-offset-stone-100 active:scale-95',
                className,
            ].join(' ')}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
            <span
                className={[
                    'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                    isDark ? 'bg-amber-400/5' : 'bg-amber-400/10',
                ].join(' ')}
                aria-hidden
            />
            {isDark ? <SunIcon className="relative h-5 w-5" /> : <MoonIcon className="relative h-5 w-5" />}
        </button>
    );
}
