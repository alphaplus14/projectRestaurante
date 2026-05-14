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
        Lang::addLines(
            [
                'validation.uploaded' => 'No se pudo subir :attribute (el límite de PHP en este equipo suele ser 2MB por archivo). Prueba con una imagen más pequeña o arranca Laravel con: composer run serve-uploads',
            ],
            app()->getLocale(),
        );
    }
}
