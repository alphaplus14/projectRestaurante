<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\MasterUser;
<<<<<<< HEAD
=======
use App\Services\Auth\MasterTwoFactorService;
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MasterAuthController extends Controller
{
<<<<<<< HEAD
    public function login(Request $request): JsonResponse
=======
    public function login(Request $request, MasterTwoFactorService $twoFactor): JsonResponse
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
    {
        config(['database.default' => 'master']);

        $data = $request->validate([
            'email' => ['required', 'email'],
<<<<<<< HEAD
            'password' => ['required', 'string'],
        ]);

        $user = MasterUser::query()
            ->where('email', $data['email'])
=======
            'password' => ['required', 'string', 'min:5'],
        ]);

        $email = strtolower(trim($data['email']));

        $user = MasterUser::query()
            ->where('email', $email)
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
            ->where('activo', true)
            ->first();

        if (! $user || ! Hash::check($data['password'], (string) $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas.'],
            ]);
        }

<<<<<<< HEAD
        $token = $user->createToken('master-web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
=======
        if ($user->hasEnabledTwoFactorAuthentication()) {
            $challengeToken = $twoFactor->createChallenge($user);
            $emailSent = $twoFactor->sendLoginCodeByEmail($user);

            return response()->json([
                'two_factor' => true,
                'challenge_token' => $challengeToken,
                'email_sent' => $emailSent,
                'message' => $emailSent
                    ? 'Ingresa el código de tu app o revisa tu correo Master.'
                    : 'Ingresa el código de tu app de autenticación.',
            ]);
        }

        return $twoFactor->tokenResponse($user);
    }

    public function twoFactorChallenge(Request $request, MasterTwoFactorService $twoFactor): JsonResponse
    {
        $data = $request->validate([
            'challenge_token' => ['required', 'string'],
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
        ]);

        if (empty($data['code']) && empty($data['recovery_code'])) {
            throw ValidationException::withMessages([
                'code' => ['Ingresa el código de 6 dígitos o un código de recuperación.'],
            ]);
        }

        return $twoFactor->completeChallenge(
            $data['challenge_token'],
            $data['code'] ?? null,
            $data['recovery_code'] ?? null,
        );
    }

    public function resendTwoFactorEmail(Request $request, MasterTwoFactorService $twoFactor): JsonResponse
    {
        $data = $request->validate([
            'challenge_token' => ['required', 'string'],
        ]);

        $sent = $twoFactor->sendLoginCodeForChallenge($data['challenge_token']);

        if (! $sent) {
            throw ValidationException::withMessages([
                'challenge_token' => ['No se pudo reenviar el correo. Espera un momento o usa tu app de autenticación.'],
            ]);
        }

        return response()->json([
            'message' => 'Código enviado de nuevo a tu correo Master.',
            'email_sent' => true,
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        ]);
    }

    public function me(Request $request): JsonResponse
    {
<<<<<<< HEAD
=======
        config(['database.default' => 'master']);

        /** @var MasterUser $user */
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
<<<<<<< HEAD
=======
                'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
<<<<<<< HEAD
=======
        config(['database.default' => 'master']);

>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
        $user = $request->user();
        $user?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión master cerrada.']);
    }
}
