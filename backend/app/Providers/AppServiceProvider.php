<?php

namespace App\Providers;

use Illuminate\Support\Facades\Lang;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureSslCaBundle();

        Lang::addLines(
            [
                'validation.uploaded' => 'No se pudo subir :attribute (el límite de PHP en este equipo suele ser 2MB por archivo). Prueba con una imagen más pequeña o arranca Laravel con: composer run serve-uploads',
            ],
            app()->getLocale(),
        );
    }

    /**
     * Windows/XAMPP: sin esto cURL falla al llamar APIs HTTPS (p. ej. Google OAuth).
     */
    private function configureSslCaBundle(): void
    {
        $custom = env('SSL_CA_BUNDLE');
        $candidates = array_filter([
            is_string($custom) && $custom !== '' ? $custom : null,
            base_path('certs/cacert.pem'),
            storage_path('app/cacert.pem'),
        ]);

        foreach ($candidates as $path) {
            if (is_string($path) && is_file($path)) {
                ini_set('curl.cainfo', $path);
                ini_set('openssl.cafile', $path);

                return;
            }
        }
    }
}
