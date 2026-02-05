<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LineService
{
    private const VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';
    private const PROFILE_URL = 'https://api.line.me/v2/profile';

    public function verifyAccessToken(string $accessToken): ?array
    {
        $cacheKey = 'line_token_' . hash('sha256', $accessToken);

        return Cache::remember($cacheKey, 300, function () use ($accessToken) {
            $response = Http::get(self::VERIFY_URL, [
                'access_token' => $accessToken,
            ]);

            if ($response->failed()) {
                return null;
            }

            $data = $response->json();

            // Check if token is expired
            if (($data['expires_in'] ?? 0) <= 0) {
                return null;
            }

            // Verify channel ID matches
            $channelId = config('services.line.channel_id');
            if ($channelId && ($data['client_id'] ?? '') !== $channelId) {
                return null;
            }

            return $data;
        });
    }

    public function getProfile(string $accessToken): ?array
    {
        $response = Http::withToken($accessToken)->get(self::PROFILE_URL);

        if ($response->failed()) {
            return null;
        }

        return $response->json();
    }
}
