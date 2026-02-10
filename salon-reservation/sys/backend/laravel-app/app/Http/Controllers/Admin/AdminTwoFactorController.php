<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use OTPHP\TOTP;

class AdminTwoFactorController extends Controller
{
    public function setup(Request $request): JsonResponse
    {
        $user = $request->get('admin_user');

        $totp = TOTP::generate();
        $totp->setLabel($user->username);
        $totp->setIssuer('Salon Reservation');

        $user->update([
            'two_factor_secret' => $totp->getSecret(),
        ]);

        return response()->json([
            'secret' => $totp->getSecret(),
            'provisioning_uri' => $totp->getProvisioningUri(),
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->get('admin_user');

        $totp = TOTP::createFromSecret($user->two_factor_secret);

        if (!$totp->verify($validated['code'])) {
            return response()->json([
                'error' => 'invalid_code',
                'message' => 'Invalid verification code',
            ], 422);
        }

        // Generate recovery codes
        $recoveryCodes = [];
        $plainCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $code = strtoupper(Str::random(4) . '-' . Str::random(4));
            $plainCodes[] = $code;
            $recoveryCodes[] = Hash::make($code);
        }

        $user->update([
            'two_factor_enabled' => true,
            'two_factor_recovery_codes' => json_encode($recoveryCodes),
        ]);

        return response()->json([
            'recovery_codes' => $plainCodes,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->get('admin_user');

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Invalid password',
            ], 401);
        }

        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_enabled' => false,
        ]);

        return response()->json(['message' => '2FA disabled successfully']);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->get('admin_user');

        return response()->json([
            'enabled' => $user->two_factor_enabled,
        ]);
    }
}
