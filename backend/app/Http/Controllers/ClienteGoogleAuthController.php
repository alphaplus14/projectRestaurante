<?php

namespace App\Http\Controllers;

use App\Models\Cargo;
use App\Models\Usuario;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\Provider as SocialiteProvider;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;

class ClienteGoogleAuthController extends Controller
{
    public function redirect(Request $request): SymfonyRedirect
    {
        $redirectAfter = $this->sanitizeFrontendPath($request->query('redirect', '/cliente/carta'));

        // Sin sesión: evita fallos cuando el front (localhost:5173) y el callback (127.0.0.1:8000) no comparten cookie.
        return $this->googleSocialite()
            ->with(['state' => $this->encodeOAuthState($redirectAfter)])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $redirectPath = $this->decodeOAuthState($request->query('state'));

        try {
            $googleUser = $this->googleSocialite()->user();
        } catch (\Throwable $e) {
            Log::error('Google OAuth callback failed', [
                'message' => $e->getMessage(),
                'class' => $e::class,
            ]);

            $message = config('app.debug')
                ? 'Google: '.$e->getMessage()
                : 'No se pudo completar el inicio con Google. Intenta de nuevo.';

            return redirect($this->oauthCallbackUrl($frontend, [
                'error' => $message,
            ]));
        }

        if (! $googleUser->getEmail()) {
            return redirect($this->oauthCallbackUrl($frontend, [
                'error' => 'Tu cuenta de Google no compartió un correo. Usa registro con correo.',
            ]));
        }

        try {
            $usuario = $this->resolveClienteFromGoogle($googleUser);
        } catch (\RuntimeException $e) {
            return redirect($this->oauthCallbackUrl($frontend, [
                'error' => $e->getMessage(),
            ]));
        }

        $token = $usuario->createToken('google-oauth')->plainTextToken;

        return redirect($this->oauthCallbackUrl($frontend, [
            'token' => $token,
            'redirect' => $redirectPath,
        ]));
    }

    private function resolveClienteFromGoogle(\Laravel\Socialite\Contracts\User $googleUser): Usuario
    {
        $googleId = (string) $googleUser->getId();
        $correo = strtolower(trim((string) $googleUser->getEmail()));

        $cargoCliente = Cargo::query()->where('nombre', 'CLIENTE')->first();
        if (! $cargoCliente) {
            throw new \RuntimeException('No está configurado el rol de cliente.');
        }

        $usuario = Usuario::query()->where('google_id', $googleId)->first();

        if (! $usuario) {
            $usuario = Usuario::query()->with('cargo')->where('correo', $correo)->first();
        }

        if ($usuario) {
            if ($usuario->cargo?->nombre !== 'CLIENTE') {
                throw new \RuntimeException('Este correo ya está registrado como personal del restaurante.');
            }
            if (! $usuario->activo) {
                throw new \RuntimeException('Tu cuenta está inactiva. Contacta al restaurante.');
            }

            $updates = [];
            if (! $usuario->google_id) {
                $updates['google_id'] = $googleId;
            }
            if (trim((string) $usuario->nombre) === '' || trim((string) $usuario->apellido) === '') {
                [$nombre, $apellido] = $this->splitNombre($googleUser);
                if (trim((string) $usuario->nombre) === '') {
                    $updates['nombre'] = $nombre;
                }
                if (trim((string) $usuario->apellido) === '') {
                    $updates['apellido'] = $apellido;
                }
            }
            if ($updates !== []) {
                $usuario->update($updates);
            }

            $usuario->load('cargo');

            return $usuario;
        }

        [$nombre, $apellido] = $this->splitNombre($googleUser);

        return Usuario::query()->create([
            'nombre' => $nombre,
            'apellido' => $apellido,
            'cedula' => $this->generarCedulaWebUnica(),
            'telefono' => '0000000000',
            'correo' => $correo,
            'google_id' => $googleId,
            'password' => Hash::make(Str::random(48)),
            'cargos_idCargo' => $cargoCliente->idCargo,
            'activo' => true,
            'creado_en' => now(),
        ])->load('cargo');
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitNombre(\Laravel\Socialite\Contracts\User $googleUser): array
    {
        $raw = $googleUser->getRaw();
        $given = trim((string) ($raw['given_name'] ?? ''));
        $family = trim((string) ($raw['family_name'] ?? ''));

        if ($given !== '') {
            return [$given, $family !== '' ? $family : '—'];
        }

        $full = trim((string) ($googleUser->getName() ?? 'Cliente'));
        $parts = preg_split('/\s+/', $full, 2) ?: [];

        return [
            $parts[0] ?? 'Cliente',
            $parts[1] ?? '—',
        ];
    }

    private function generarCedulaWebUnica(): string
    {
        do {
            $cedula = 'WEB'.now()->format('ymdHis').random_int(100, 999);
        } while (Usuario::query()->where('cedula', $cedula)->exists());

        return $cedula;
    }

    private function sanitizeFrontendPath(?string $path): string
    {
        $path = is_string($path) ? $path : '/cliente/carta';
        if (! str_starts_with($path, '/')) {
            $path = '/'.$path;
        }
        if (str_contains($path, '//') || str_contains($path, '..')) {
            return '/cliente/carta';
        }

        return $path;
    }

    /**
     * @param  array<string, string>  $params
     */
    private function oauthCallbackUrl(string $frontend, array $params): string
    {
        return $frontend.'/cliente/oauth-callback?'.http_build_query($params);
    }

    private function googleSocialite(): SocialiteProvider
    {
        $driver = Socialite::driver('google')->stateless();

        $caBundle = $this->resolveCaBundlePath();
        if ($caBundle !== null) {
            $driver->setHttpClient(new GuzzleClient(['verify' => $caBundle]));
        }

        return $driver;
    }

    private function resolveCaBundlePath(): ?string
    {
        $custom = env('SSL_CA_BUNDLE');
        $candidates = array_filter([
            is_string($custom) && $custom !== '' ? $custom : null,
            base_path('certs/cacert.pem'),
            storage_path('app/cacert.pem'),
        ]);

        foreach ($candidates as $path) {
            if (is_string($path) && is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function encodeOAuthState(string $redirectPath): string
    {
        $payload = json_encode(['redirect' => $redirectPath], JSON_THROW_ON_ERROR);

        return rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    }

    private function decodeOAuthState(?string $state): string
    {
        if (! is_string($state) || $state === '') {
            return '/cliente/carta';
        }

        try {
            $b64 = strtr($state, '-_', '+/');
            $pad = strlen($b64) % 4;
            if ($pad > 0) {
                $b64 .= str_repeat('=', 4 - $pad);
            }
            $json = base64_decode($b64, true);
            if ($json === false) {
                return '/cliente/carta';
            }
            $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
            $redirect = is_array($data) ? ($data['redirect'] ?? null) : null;

            return $this->sanitizeFrontendPath(is_string($redirect) ? $redirect : '/cliente/carta');
        } catch (\Throwable) {
            return '/cliente/carta';
        }
    }
}
