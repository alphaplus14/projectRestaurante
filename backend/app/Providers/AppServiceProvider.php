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
                'auth.failed' => 'Credenciales inválidas.',
                'passwords.sent' => 'Si el correo pertenece a un administrador activo, recibirás un enlace para restablecer la contraseña.',
                'passwords.reset' => 'Contraseña actualizada correctamente.',
                'passwords.token' => 'El enlace de recuperación no es válido o ya expiró.',
                'passwords.user' => 'No encontramos un administrador con ese correo.',
                'passwords.throttled' => 'Espera un momento antes de volver a solicitar el enlace.',
                'validation.uploaded' => 'No se pudo subir la imagen. Puede ser demasiado pesada para el servidor; prueba con un archivo más liviano o continúa sin logo.',
                'validation.max.file' => 'La imagen es demasiado pesada. Elige un archivo más liviano o continúa sin logo.',
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
