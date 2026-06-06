<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cargo;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        return $this->issueToken($request);
    }

    public function loginCliente(Request $request)
    {
        return $this->issueToken($request, requiredRole: 'CLIENTE');
    }

    public function registerCliente(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'apellido' => ['required', 'string', 'max:120'],
            'correo' => ['required', 'email', 'max:190', 'unique:usuario,correo'],
            'telefono' => ['required', 'string', 'max:40'],
            'cedula' => ['nullable', 'string', 'max:32', 'unique:usuario,cedula'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $cargoCliente = Cargo::query()->where('nombre', 'CLIENTE')->first();
        if (! $cargoCliente) {
            return response()->json(['message' => 'No está configurado el rol de cliente.'], 500);
        }

        $cedula = trim((string) ($data['cedula'] ?? ''));
        if ($cedula === '') {
            $cedula = $this->generarCedulaWebUnica();
        }

        $usuario = Usuario::create([
            'nombre' => trim($data['nombre']),
            'apellido' => trim($data['apellido']),
            'cedula' => $cedula,
            'telefono' => trim($data['telefono']),
            'correo' => strtolower(trim($data['correo'])),
            'password' => $data['password'],
            'cargos_idCargo' => $cargoCliente->idCargo,
            'activo' => true,
            'creado_en' => now(),
        ]);

        $usuario->load('cargo');

        $deviceName = $data['device_name'] ?? ($request->userAgent() ?: 'web');
        $token = $usuario->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Cuenta creada. Ya puedes reservar y usar la carta con tu sesión.',
            'token' => $token,
            'user' => $this->serializeUser($usuario),
        ], 201);
    }

    public function loginCocina(Request $request)
    {
        return $this->issueToken($request, requiredRole: 'COCINERO');
    }

    public function loginMesero(Request $request)
    {
        return $this->issueToken($request, requiredRole: 'MESERO');
    }

    public function loginCajero(Request $request)
    {
        return $this->issueToken($request, requiredRole: 'CAJERO');
    }

    public function loginAdmin(Request $request)
    {
        return $this->issueToken($request, requiredRole: 'ADMINISTRADOR');
    }

    public function me(Request $request)
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();
        $usuario->loadMissing('cargo');

        return response()->json([
            'user' => $this->serializeUser($usuario),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesión cerrada.',
        ]);
    }

    private function issueToken(Request $request, ?string $requiredRole = null)
    {
        $data = $request->validate([
            'correo' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $usuario = Usuario::query()
            ->with('cargo')
            ->where('correo', $data['correo'])
            ->where('activo', true)
            ->first();

        if (! $usuario || ! Hash::check($data['password'], (string) $usuario->password)) {
            throw ValidationException::withMessages([
                'correo' => ['Credenciales inválidas.'],
            ]);
        }

        if ($requiredRole !== null && ($usuario->cargo?->nombre !== $requiredRole)) {
            return response()->json([
                'message' => "Este login es solo para {$requiredRole}.",
            ], 403);
        }

        $deviceName = $data['device_name'] ?? ($request->userAgent() ?: 'web');
        $token = $usuario->createToken($deviceName)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->serializeUser($usuario),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(Usuario $usuario): array
    {
        return [
            'idUsuario' => $usuario->idUsuario,
            'nombre' => $usuario->nombre,
            'apellido' => $usuario->apellido,
            'correo' => $usuario->correo,
            'cargos_idCargo' => $usuario->cargos_idCargo,
            'rol' => $usuario->cargo?->nombre,
        ];
    }

    private function generarCedulaWebUnica(): string
    {
        do {
            $cedula = 'WEB'.now()->format('ymdHis').random_int(100, 999);
        } while (Usuario::query()->where('cedula', $cedula)->exists());

        return $cedula;
    }
}

