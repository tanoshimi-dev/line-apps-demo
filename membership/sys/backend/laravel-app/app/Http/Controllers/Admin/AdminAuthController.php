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
        ]);
    }
}
