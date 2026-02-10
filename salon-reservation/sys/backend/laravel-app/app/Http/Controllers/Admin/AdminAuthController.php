<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminToken;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use OTPHP\TOTP;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = AdminUser::where('username', $validated['username'])
            ->where('is_active', true)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = Str::random(64);

        if ($user->two_factor_enabled) {
            $adminToken = AdminToken::create([
                'admin_user_id' => $user->id,
                'token' => $token,
                'expires_at' => now()->addMinutes(5),
                'two_factor_confirmed' => false,
            ]);

            return response()->json([
                'token' => $token,
                'two_factor_required' => true,
                'user' => $user,
                'expires_at' => $adminToken->expires_at->toIso8601String(),
            ]);
        }

        $adminToken = AdminToken::create([
            'admin_user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addHours(24),
            'two_factor_confirmed' => true,
        ]);

        return response()->json([
            'token' => $token,
            'two_factor_required' => false,
            'user' => $user,
            'expires_at' => $adminToken->expires_at->toIso8601String(),
        ]);
    }

    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'code' => 'required|string',
        ]);

        $adminToken = AdminToken::where('token', $validated['token'])
            ->where('expires_at', '>', now())
            ->where('two_factor_confirmed', false)
            ->first();

        if (!$adminToken) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Invalid or expired token',
            ], 401);
        }

        $user = $adminToken->adminUser;

        // Try TOTP verification
        $totp = TOTP::createFromSecret($user->two_factor_secret);
        $verified = $totp->verify($validated['code']);

        // If TOTP fails, try recovery codes
        if (!$verified) {
            $recoveryCodes = json_decode($user->two_factor_recovery_codes, true) ?? [];
            $codeIndex = null;

            foreach ($recoveryCodes as $index => $hashedCode) {
                if (Hash::check($validated['code'], $hashedCode)) {
                    $codeIndex = $index;
                    break;
                }
            }

            if ($codeIndex !== null) {
                unset($recoveryCodes[$codeIndex]);
                $user->update([
                    'two_factor_recovery_codes' => json_encode(array_values($recoveryCodes)),
                ]);
                $verified = true;
            }
        }

        if (!$verified) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Invalid verification code',
            ], 401);
        }

        $newToken = Str::random(64);
        $adminToken->update([
            'token' => $newToken,
            'two_factor_confirmed' => true,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'token' => $newToken,
            'user' => $user,
            'expires_at' => $adminToken->fresh()->expires_at->toIso8601String(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if ($token && $token !== 'dev_admin_token') {
            AdminToken::where('token', $token)->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->get('admin_user'));
    }
}
