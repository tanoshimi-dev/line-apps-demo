<?php

use App\Http\Controllers\MemberController;
use App\Http\Controllers\PointController;
use App\Http\Controllers\QrClaimController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminMemberController;
use App\Http\Controllers\Admin\AdminTransactionController;
use App\Http\Controllers\Admin\AdminQrController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Middleware\AdminAuthMiddleware;
use App\Http\Middleware\AdminRoleMiddleware;
use App\Http\Middleware\LineAuthMiddleware;
use Illuminate\Support\Facades\Route;

// LINE auth member endpoints
Route::middleware([LineAuthMiddleware::class])->group(function () {
    Route::get('/member', [MemberController::class, 'index']);
    Route::post('/member/register', [MemberController::class, 'register']);
    Route::get('/member/qrcode', [MemberController::class, 'qrcode']);

    Route::get('/points/history', [PointController::class, 'history']);
    Route::post('/points/add', [PointController::class, 'add']);
    Route::post('/points/use', [PointController::class, 'use']);

    // QR claim endpoints (member-facing)
    Route::get('/qr/validate/{token}', [QrClaimController::class, 'validateToken']);
    Route::post('/qr/claim', [QrClaimController::class, 'claim']);
});

// Admin auth (no middleware)
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Admin endpoints (admin auth required)
Route::middleware([AdminAuthMiddleware::class])->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    Route::get('/members', [AdminMemberController::class, 'index']);
    Route::get('/members/{id}', [AdminMemberController::class, 'show']);

    Route::get('/transactions', [AdminTransactionController::class, 'index']);

    Route::post('/qr/spend', [AdminQrController::class, 'createSpend']);
    Route::post('/qr/earn', [AdminQrController::class, 'createEarn']);
    Route::get('/qr/sessions', [AdminQrController::class, 'sessions']);
    Route::get('/qr/sessions/{id}', [AdminQrController::class, 'show']);

    // Admin-only settings & operator management
    Route::middleware([AdminRoleMiddleware::class . ':admin'])->group(function () {
        Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
        Route::put('/settings', [AdminSettingsController::class, 'updateSettings']);

        Route::get('/operators', [AdminSettingsController::class, 'operatorIndex']);
        Route::post('/operators', [AdminSettingsController::class, 'operatorStore']);
        Route::put('/operators/{id}', [AdminSettingsController::class, 'operatorUpdate']);
        Route::delete('/operators/{id}', [AdminSettingsController::class, 'operatorDestroy']);
    });
});

// Health check endpoint (no auth required)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});
