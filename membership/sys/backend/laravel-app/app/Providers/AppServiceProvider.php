<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Rate limiter: admin login (5 attempts per minute per IP)
        RateLimiter::for('admin-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Rate limiter: QR claim (10 attempts per minute per user)
        RateLimiter::for('qr-claim', function (Request $request) {
            return Limit::perMinute(10)->by($request->bearerToken() ?: $request->ip());
        });

        // Rate limiter: general API (60 per minute per user)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->bearerToken() ?: $request->ip());
        });
    }
}
