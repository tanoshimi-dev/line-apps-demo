<?php

namespace App\Http\Middleware;

use App\Models\AdminToken;
use App\Models\AdminUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Admin token is required',
            ], 401);
        }

        // Dev bypass
        if (config('app.debug') && $token === 'dev_admin_token') {
            $adminUser = AdminUser::where('is_active', true)->first();
            if ($adminUser) {
                $request->merge(['admin_user' => $adminUser]);
                return $next($request);
            }
        }

        $adminToken = AdminToken::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$adminToken) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Invalid or expired admin token',
            ], 401);
        }

        if (!$adminToken->two_factor_confirmed) {
            return response()->json([
                'error' => 'two_factor_required',
                'message' => 'Two-factor authentication is required',
            ], 401);
        }

        $adminUser = $adminToken->adminUser;

        if (!$adminUser || !$adminUser->is_active) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Admin account is inactive',
            ], 401);
        }

        $request->merge(['admin_user' => $adminUser]);

        return $next($request);
    }
}
