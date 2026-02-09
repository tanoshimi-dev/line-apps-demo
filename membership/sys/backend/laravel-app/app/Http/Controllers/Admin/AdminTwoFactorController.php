<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use OTPHP\TOTP;

class AdminTwoFactorController extends Controller
{
    public function setup(Request $request): JsonResponse
    {
        $adminUser = $request->input('admin_user');

        if ($adminUser->two_factor_enabled) {
            return response()->json([
                'error' => 'Two-factor authentication is already enabled',
            ], 400);
        }

        $totp = TOTP::generate();
        $totp->setLabel($adminUser->username);
        $totp->setIssuer('MembersCard Admin');

        // Store the secret temporarily (not yet enabled)
        $adminUser->two_factor_secret = $totp->getSecret();
        $adminUser->save();

        return response()->json([
            'secret' => $totp->getSecret(),
            'otpauth_uri' => $totp->getProvisioningUri(),
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $adminUser = $request->input('admin_user');

        if ($adminUser->two_factor_enabled) {
            return response()->json([
                'error' => 'Two-factor authentication is already enabled',
            ], 400);
        }

        if (!$adminUser->two_factor_secret) {
            return response()->json([
                'error' => 'Please call setup first',
            ], 400);
        }

        $totp = TOTP::createFromSecret($adminUser->two_factor_secret);
        $totp->setLabel($adminUser->username);

        if (!$totp->verify($request->input('code'))) {
            return response()->json([
                'error' => 'Invalid verification code',
            ], 422);
        }

        // Generate 8 recovery codes
        $recoveryCodes = [];
        $hashedCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $code = strtoupper(Str::random(4) . '-' . Str::random(4));
            $recoveryCodes[] = $code;
            $hashedCodes[] = Hash::make($code);
        }

        $adminUser->two_factor_enabled = true;
        $adminUser->two_factor_recovery_codes = json_encode($hashedCodes);
        $adminUser->save();

        return response()->json([
            'message' => 'Two-factor authentication enabled',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $adminUser = $request->input('admin_user');

        if (!Hash::check($request->input('password'), $adminUser->password)) {
            return response()->json([
                'error' => 'Invalid password',
            ], 401);
        }

        $adminUser->two_factor_secret = null;
        $adminUser->two_factor_recovery_codes = null;
        $adminUser->two_factor_enabled = false;
        $adminUser->save();

        return response()->json([
            'message' => 'Two-factor authentication disabled',
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $adminUser = $request->input('admin_user');

        return response()->json([
            'two_factor_enabled' => $adminUser->two_factor_enabled,
        ]);
    }
}
