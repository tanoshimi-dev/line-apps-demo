<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminToken;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use OTPHP\TOTP;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $adminUser = AdminUser::where('username', $request->input('username'))->first();

        if (!$adminUser || !Hash::check($request->input('password'), $adminUser->password)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid username or password',
            ], 401);
        }

        if (!$adminUser->is_active) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Account is disabled',
            ], 401);
        }

        // If 2FA is enabled, create a pending token
        if ($adminUser->two_factor_enabled) {
            $token = AdminToken::create([
                'admin_user_id' => $adminUser->id,
                'token' => Str::random(64),
                'expires_at' => now()->addMinutes(5),
                'two_factor_confirmed' => false,
            ]);

            return response()->json([
                'two_factor_required' => true,
                'token' => $token->token,
            ]);
        }

        $token = AdminToken::create([
            'admin_user_id' => $adminUser->id,
            'token' => Str::random(64),
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'token' => $token->token,
            'expires_at' => $token->expires_at->toIso8601String(),
            'user' => [
                'id' => $adminUser->id,
                'username' => $adminUser->username,
                'name' => $adminUser->name,
                'role' => $adminUser->role,
            ],
        ]);
    }

    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $bearerToken = $request->bearerToken();

        if (!$bearerToken) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Token is required',
            ], 401);
        }

        $adminToken = AdminToken::where('token', $bearerToken)
            ->where('expires_at', '>', now())
            ->where('two_factor_confirmed', false)
            ->first();

        if (!$adminToken) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid or expired token',
            ], 401);
        }

        $adminUser = $adminToken->adminUser;

        if (!$adminUser || !$adminUser->is_active) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Account is disabled',
            ], 401);
        }

        $code = $request->input('code');
        $verified = false;

        // Try TOTP verification first
        $totp = TOTP::createFromSecret($adminUser->two_factor_secret);
        $totp->setLabel($adminUser->username);
        if ($totp->verify($code)) {
            $verified = true;
        }

        // Try recovery codes as fallback
        if (!$verified && strlen($code) > 6) {
            $recoveryCodes = json_decode($adminUser->two_factor_recovery_codes, true) ?: [];
            foreach ($recoveryCodes as $index => $hashedCode) {
                if (Hash::check($code, $hashedCode)) {
                    $verified = true;
                    // Remove used recovery code
                    unset($recoveryCodes[$index]);
                    $adminUser->two_factor_recovery_codes = json_encode(array_values($recoveryCodes));
                    $adminUser->save();
                    break;
                }
            }
        }

        if (!$verified) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid verification code',
            ], 401);
        }

        // Promote token to fully confirmed with 24h expiry
        $adminToken->update([
            'two_factor_confirmed' => true,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'token' => $adminToken->token,
            'expires_at' => $adminToken->expires_at->toIso8601String(),
            'user' => [
                'id' => $adminUser->id,
                'username' => $adminUser->username,
                'name' => $adminUser->name,
                'role' => $adminUser->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if ($token && $token !== 'dev_admin_token') {
            AdminToken::where('token', $token)->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $adminUser = $request->input('admin_user');

        return response()->json([
            'id' => $adminUser->id,
            'username' => $adminUser->username,
            'name' => $adminUser->name,
            'role' => $adminUser->role,
            'two_factor_enabled' => $adminUser->two_factor_enabled,
        ]);
    }
}
