import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const THEME_STORAGE_KEY = 'napa-theme';

const ThemeContext = createContext({
    theme: 'dark',
    setTheme: () => {},
    toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        try {
            const raw = localStorage.getItem(THEME_STORAGE_KEY);
            if (raw === 'light' || raw === 'dark') return raw;
        } catch {
            /* ignore */
        }
        return 'dark';
    });

    const applyDom = useCallback((next) => {
        const root = document.documentElement;
        root.dataset.theme = next;
        root.classList.toggle('dark', next === 'dark');
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        applyDom(theme);
    }, [theme, applyDom]);

    const setTheme = useCallback((next) => {
        if (next === 'light' || next === 'dark') setThemeState(next);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
