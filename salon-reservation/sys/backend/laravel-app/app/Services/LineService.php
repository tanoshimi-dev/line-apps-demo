<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LineService
{
    private const VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';
    private const PROFILE_URL = 'https://api.line.me/v2/profile';
    private const PUSH_URL = 'https://api.line.me/v2/bot/message/push';

    public function verifyAccessToken(string $accessToken): ?array
    {
        $cacheKey = 'line_token_' . hash('sha256', $accessToken);

        return Cache::remember($cacheKey, 300, function () use ($accessToken) {
            try {
                $response = Http::get(self::VERIFY_URL, [
                    'access_token' => $accessToken,
                ]);

                if ($response->failed()) {
                    return null;
                }

                $data = $response->json();

                if (($data['expires_in'] ?? 0) <= 0) {
                    return null;
                }

                $channelId = config('services.line.channel_id');
                if ($channelId && (string) ($data['client_id'] ?? '') !== (string) $channelId) {
                    return null;
                }

                return $data;
            } catch (\Exception $e) {
                Log::error('LINE token verification failed: ' . $e->getMessage());
                return null;
            }
        });
    }

    public function getProfile(string $accessToken): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->get(self::PROFILE_URL);

            if ($response->failed()) {
                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('LINE profile fetch failed: ' . $e->getMessage());
            return null;
        }
    }

    public function pushMessage(string $userId, string $message): bool
    {
        $channelAccessToken = config('services.line.channel_access_token');

        if (!$channelAccessToken) {
            Log::warning('LINE channel access token not configured');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $channelAccessToken,
                'Content-Type' => 'application/json',
            ])->post(self::PUSH_URL, [
                'to' => $userId,
                'messages' => [
                    [
                        'type' => 'text',
                        'text' => $message,
                    ],
                ],
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('LINE push message failed: ' . $e->getMessage());
            return false;
        }
    }
}
