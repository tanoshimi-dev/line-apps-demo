<?php

use App\Http\Controllers\MemberController;
use App\Http\Controllers\PointController;
use App\Http\Middleware\LineAuthMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware([LineAuthMiddleware::class])->group(function () {
    // Member endpoints
    Route::get('/member', [MemberController::class, 'index']);
    Route::post('/member/register', [MemberController::class, 'register']);
    Route::get('/member/qrcode', [MemberController::class, 'qrcode']);

    // Points endpoints
    Route::get('/points/history', [PointController::class, 'history']);
    Route::post('/points/add', [PointController::class, 'add']);
    Route::post('/points/use', [PointController::class, 'use']);
});

// Health check endpoint (no auth required)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});
