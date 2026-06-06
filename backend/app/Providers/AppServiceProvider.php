<?php

namespace App\Providers;

use App\Models\Pedido;
use App\Models\Reserva;
use App\Models\Venta;
use App\Policies\PedidoPolicy;
use App\Policies\ReservaPolicy;
use App\Policies\VentaPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\RateLimiter;
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
        $this->configureRateLimiting();

        // Autorización a nivel de recurso (dueño), reforzando la protección por rol.
        Gate::policy(Pedido::class, PedidoPolicy::class);
        Gate::policy(Venta::class, VentaPolicy::class);
        Gate::policy(Reserva::class, ReservaPolicy::class);

        Lang::addLines(
            [
                'validation.uploaded' => 'No se pudo subir :attribute (el límite de PHP en este equipo suele ser 2MB por archivo). Prueba con una imagen más pequeña o arranca Laravel con: composer run serve-uploads',
            ],
            app()->getLocale(),
        );
    }

    /**
     * Limita los intentos de autenticación para frenar ataques de fuerza bruta.
     * Clave por IP + correo, configurable con AUTH_RATE_LIMIT (intentos por minuto).
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('auth', function (Request $request) {
            $maxIntentos = (int) env('AUTH_RATE_LIMIT', 6);
            $correo = (string) $request->input('correo', '');

            return Limit::perMinute($maxIntentos)
                ->by(mb_strtolower($correo).'|'.$request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
                    ], 429);
                });
        });
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
