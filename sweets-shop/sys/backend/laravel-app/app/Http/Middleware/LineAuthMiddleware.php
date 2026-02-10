<?php

namespace App\Http\Middleware;

use App\Services\LineService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LineAuthMiddleware
{
    public function __construct(private LineService $lineService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Access token is required',
            ], 401);
        }

        // Dev bypass
        if (config('app.debug') && $token === 'dev_test_token') {
            $request->merge([
                'line_user_id' => 'dev_user_001',
                'line_display_name' => 'Dev User',
                'line_picture_url' => null,
            ]);
            return $next($request);
        }

        // Verify LINE access token
        $tokenData = $this->lineService->verifyAccessToken($token);
        if (!$tokenData) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Invalid or expired access token',
            ], 401);
        }

        // Get LINE user profile
        $profile = $this->lineService->getProfile($token);
        if (!$profile) {
            return response()->json([
                'error' => 'unauthorized',
                'message' => 'Failed to get user profile',
            ], 401);
        }

        $request->merge([
            'line_user_id' => $profile['userId'],
            'line_display_name' => $profile['displayName'] ?? '',
            'line_picture_url' => $profile['pictureUrl'] ?? null,
        ]);

        return $next($request);
    }
}
