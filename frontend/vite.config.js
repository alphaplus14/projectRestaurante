import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            // API del backend Laravel
            '/api': 'http://127.0.0.1:8001',
            // Logos e imágenes públicas (requiere php artisan storage:link)
            '/storage': 'http://127.0.0.1:8001',
            // OAuth Google (redirección del navegador al backend)
            '/auth': 'http://127.0.0.1:8001',
        },
    },
});
