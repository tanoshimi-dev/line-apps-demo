<?php

namespace App\Http\Middleware;

use App\Services\LineService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LineAuthMiddleware
{
    public function __construct(
        private LineService $lineService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Development mode: bypass LINE auth when APP_DEBUG=true and using test token
        if (config('app.debug') && $request->bearerToken() === 'dev_test_token') {
            $request->merge([
                'line_user_id' => $request->header('X-Test-User-Id', 'test_user_001'),
                'line_display_name' => $request->header('X-Test-Display-Name', 'Test User'),
                'line_picture_url' => $request->header('X-Test-Picture-Url'),
            ]);
            return $next($request);
        }

        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Access token is required',
            ], 401);
        }

        // Verify the access token
        $tokenData = $this->lineService->verifyAccessToken($token);

        if (!$tokenData) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid or expired access token',
            ], 401);
        }

        // Get user profile
        $profile = $this->lineService->getProfile($token);

        if (!$profile) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Could not retrieve user profile',
            ], 401);
        }

        // Attach LINE user data to request
        $request->merge([
            'line_user_id' => $profile['userId'],
            'line_display_name' => $profile['displayName'] ?? null,
            'line_picture_url' => $profile['pictureUrl'] ?? null,
        ]);

        return $next($request);
    }
}
