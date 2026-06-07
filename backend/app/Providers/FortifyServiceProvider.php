<?php

namespace App\Providers;

use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\Fortify\AdminLoginResponse;
use App\Models\Usuario;
use App\Support\Tenancy\TenantUrl;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, AdminLoginResponse::class);
        $this->app->singleton(ResetsUserPasswords::class, ResetUserPassword::class);
    }

    public function boot(): void
    {
        Fortify::ignoreRoutes();
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $tenant = app()->bound('tenant.current') ? app('tenant.current') : null;
            $base = $tenant
                ? TenantUrl::appForSlug($tenant->slug)
                : TenantUrl::frontendOrigin();

            return $base.'/restablecer-contrasena?token='.urlencode($token)
                .'&correo='.urlencode($user->getEmailForPasswordReset());
        });

        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $tenant = app()->bound('tenant.current') ? app('tenant.current') : null;
            $base = $tenant
                ? TenantUrl::appForSlug($tenant->slug)
                : TenantUrl::frontendOrigin();

            $url = $base.'/restablecer-contrasena?token='.urlencode($token)
                .'&correo='.urlencode($notifiable->getEmailForPasswordReset());

            $minutes = (int) config('auth.passwords.usuarios.expire', 60);

            return (new MailMessage)
                ->subject('Restablece tu contraseña de administrador')
                ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta de administrador.')
                ->action('Crear nueva contraseña', $url)
                ->line("Este enlace caduca en {$minutes} minutos.")
                ->line('Si no solicitaste esto, ignora este correo.');
        });

        Fortify::authenticateUsing(function (Request $request) {
            $correo = strtolower(trim((string) $request->input(Fortify::username(), '')));

            $usuario = Usuario::query()
                ->with('cargo')
                ->where('correo', $correo)
                ->where('activo', true)
                ->first();

            if (! $usuario || ! Hash::check((string) $request->password, (string) $usuario->password)) {
                return null;
            }

            if ($usuario->cargo?->nombre !== 'ADMINISTRADOR') {
                throw new HttpResponseException(response()->json([
                    'message' => 'Este login es solo para ADMINISTRADOR.',
                ], 403));
            }

            return $usuario;
        });

        Fortify::authenticateThrough(function (LoginRequest $request) {
            return array_filter([
                config('fortify.limiters.login') ? null : EnsureLoginIsNotThrottled::class,
                config('fortify.lowercase_usernames') ? CanonicalizeUsername::class : null,
                AttemptToAuthenticate::class,
            ]);
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(
                Str::lower((string) $request->input(Fortify::username())).'|'.$request->ip()
            );

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('two-factor', function (Request $request) {
            $throttleKey = Str::transliterate(
                Str::lower((string) $request->input('challenge_token', '')).'|'.$request->ip()
            );

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
