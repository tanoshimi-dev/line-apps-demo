<?php

use App\Http\Controllers\MemberController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminMemberController;
use App\Http\Controllers\Admin\AdminMessageController;
use App\Http\Controllers\Admin\AdminReservationController;
use App\Http\Controllers\Admin\AdminServiceController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminStaffController;
use App\Http\Controllers\Admin\AdminTwoFactorController;
use App\Http\Middleware\AdminAuthMiddleware;
use App\Http\Middleware\AdminRoleMiddleware;
use App\Http\Middleware\LineAuthMiddleware;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Member routes (LINE auth)
Route::middleware(LineAuthMiddleware::class)->group(function () {
    Route::get('/member', [MemberController::class, 'index']);
    Route::post('/member/register', [MemberController::class, 'register']);

    Route::get('/services', [ServiceController::class, 'index']);

    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/staff/{id}/availability', [StaffController::class, 'availability']);

    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/{id}', [ReservationController::class, 'show']);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);

    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
});

// Admin auth routes (no auth middleware, strict throttle)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/admin/2fa/verify', [AdminAuthController::class, 'verifyTwoFactor']);
});

// Admin protected routes
Route::middleware(AdminAuthMiddleware::class)->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    Route::get('/reservations', [AdminReservationController::class, 'index']);
    Route::get('/reservations/{id}', [AdminReservationController::class, 'show']);
    Route::put('/reservations/{id}/status', [AdminReservationController::class, 'updateStatus']);

    Route::get('/services', [AdminServiceController::class, 'index']);
    Route::post('/services', [AdminServiceController::class, 'store']);
    Route::put('/services/{id}', [AdminServiceController::class, 'update']);
    Route::delete('/services/{id}', [AdminServiceController::class, 'destroy']);

    Route::get('/staff', [AdminStaffController::class, 'index']);
    Route::get('/staff/{id}', [AdminStaffController::class, 'show']);
    Route::put('/staff/{id}/profile', [AdminStaffController::class, 'updateProfile']);
    Route::get('/staff/{id}/schedule', [AdminStaffController::class, 'schedule']);
    Route::put('/staff/{id}/schedule', [AdminStaffController::class, 'updateSchedule']);
    Route::post('/staff/{id}/exceptions', [AdminStaffController::class, 'addException']);
    Route::delete('/staff/{id}/exceptions/{eid}', [AdminStaffController::class, 'removeException']);

    Route::get('/members', [AdminMemberController::class, 'index']);
    Route::get('/members/{id}', [AdminMemberController::class, 'show']);

    Route::post('/messages', [AdminMessageController::class, 'store']);
    Route::get('/messages/{memberId}', [AdminMessageController::class, 'history']);

    // 2FA management
    Route::get('/2fa/setup', [AdminTwoFactorController::class, 'setup']);
    Route::post('/2fa/confirm', [AdminTwoFactorController::class, 'confirm']);
    Route::delete('/2fa', [AdminTwoFactorController::class, 'destroy']);
    Route::get('/2fa/status', [AdminTwoFactorController::class, 'status']);

    // Admin-only routes
    Route::middleware(AdminRoleMiddleware::class . ':admin')->group(function () {
        Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
        Route::put('/settings', [AdminSettingsController::class, 'updateSettings']);

        Route::get('/operators', [AdminSettingsController::class, 'operatorIndex']);
        Route::post('/operators', [AdminSettingsController::class, 'operatorStore']);
        Route::put('/operators/{id}', [AdminSettingsController::class, 'operatorUpdate']);
        Route::delete('/operators/{id}', [AdminSettingsController::class, 'operatorDestroy']);
    });
});
