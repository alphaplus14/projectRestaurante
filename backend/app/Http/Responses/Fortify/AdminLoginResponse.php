<?php

namespace App\Http\Responses\Fortify;

use App\Models\Usuario;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class AdminLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();
        $usuario->loadMissing('cargo');

        $deviceName = $request->input('device_name') ?? ($request->userAgent() ?: 'web');
        $token = $usuario->createToken($deviceName)->plainTextToken;

        auth()->guard('web')->logout();

        return response()->json([
            'token' => $token,
            'user' => [
                'idUsuario' => $usuario->idUsuario,
                'nombre' => $usuario->nombre,
                'apellido' => $usuario->apellido,
                'correo' => $usuario->correo,
                'cargos_idCargo' => $usuario->cargos_idCargo,
                'rol' => $usuario->cargo?->nombre,
            ],
        ]);
    }
}
