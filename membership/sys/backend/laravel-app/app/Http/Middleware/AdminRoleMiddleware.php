<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminRoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role = 'admin'): Response
    {
        $adminUser = $request->input('admin_user');

        if (!$adminUser || $adminUser->role !== $role) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Insufficient permissions',
            ], 403);
        }

        return $next($request);
    }
}
