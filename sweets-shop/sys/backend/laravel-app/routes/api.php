<?php

use App\Http\Controllers\MemberController;
use App\Http\Controllers\PointController;
use App\Http\Controllers\QrCodeController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ReviewTicketController;
use App\Http\Controllers\ShopNewsController;
use App\Http\Controllers\SweetsCategoryController;
use App\Http\Controllers\SweetsItemController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminMemberController;
use App\Http\Controllers\Admin\AdminNewsController;
use App\Http\Controllers\Admin\AdminPointTransactionController;
use App\Http\Controllers\Admin\AdminQrCodeController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminReviewTicketController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminStockController;
use App\Http\Controllers\Admin\AdminSweetsCategoryController;
use App\Http\Controllers\Admin\AdminSweetsItemController;
use App\Http\Controllers\Admin\AdminTwoFactorController;
use App\Http\Middleware\AdminAuthMiddleware;
use App\Http\Middleware\AdminRoleMiddleware;
use App\Http\Middleware\LineAuthMiddleware;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'app' => 'Sweets Shop']));

// Public routes
Route::get('/categories', [SweetsCategoryController::class, 'index']);
Route::get('/categories/{id}', [SweetsCategoryController::class, 'show']);
Route::get('/items', [SweetsItemController::class, 'index']);
Route::get('/items/{id}', [SweetsItemController::class, 'show']);
Route::get('/news', [ShopNewsController::class, 'index']);
Route::get('/news/{id}', [ShopNewsController::class, 'show']);

// LINE authenticated member routes
Route::middleware(LineAuthMiddleware::class)->group(function () {
    Route::get('/member', [MemberController::class, 'index']);
    Route::post('/member', [MemberController::class, 'register']);

    // Points
    Route::get('/points/balance', [PointController::class, 'balance']);
    Route::get('/points/transactions', [PointController::class, 'transactions']);

    // QR code redemption
    Route::post('/qr/earn', [QrCodeController::class, 'redeemEarnPoints']);
    Route::post('/qr/spend', [QrCodeController::class, 'redeemSpendPoints']);
    Route::post('/qr/review-ticket', [QrCodeController::class, 'redeemReviewTicket']);

    // Review tickets
    Route::get('/review-tickets', [ReviewTicketController::class, 'index']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/reviews/mine', [ReviewController::class, 'myReviews']);
});

// Admin auth routes (throttled)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/admin/2fa/verify', [AdminAuthController::class, 'verifyTwoFactor']);
});

// Admin protected routes
Route::middleware([AdminAuthMiddleware::class])->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    // Categories CRUD
    Route::get('/categories', [AdminSweetsCategoryController::class, 'index']);
    Route::post('/categories', [AdminSweetsCategoryController::class, 'store']);
    Route::get('/categories/{id}', [AdminSweetsCategoryController::class, 'show']);
    Route::post('/categories/{id}', [AdminSweetsCategoryController::class, 'update']);
    Route::delete('/categories/{id}', [AdminSweetsCategoryController::class, 'destroy']);

    // Items CRUD
    Route::get('/items', [AdminSweetsItemController::class, 'index']);
    Route::post('/items', [AdminSweetsItemController::class, 'store']);
    Route::get('/items/{id}', [AdminSweetsItemController::class, 'show']);
    Route::post('/items/{id}', [AdminSweetsItemController::class, 'update']);
    Route::delete('/items/{id}', [AdminSweetsItemController::class, 'destroy']);

    // Stock
    Route::put('/items/{id}/stock', [AdminStockController::class, 'updateStock']);

    // News CRUD
    Route::get('/news', [AdminNewsController::class, 'index']);
    Route::post('/news', [AdminNewsController::class, 'store']);
    Route::get('/news/{id}', [AdminNewsController::class, 'show']);
    Route::post('/news/{id}', [AdminNewsController::class, 'update']);
    Route::delete('/news/{id}', [AdminNewsController::class, 'destroy']);

    // Members
    Route::get('/members', [AdminMemberController::class, 'index']);
    Route::get('/members/{id}', [AdminMemberController::class, 'show']);

    // Point transactions
    Route::get('/point-transactions', [AdminPointTransactionController::class, 'index']);

    // Review tickets
    Route::get('/review-tickets', [AdminReviewTicketController::class, 'index']);

    // Reviews
    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::put('/reviews/{id}/visibility', [AdminReviewController::class, 'updateVisibility']);

    // QR code generation
    Route::post('/qr/generate', [AdminQrCodeController::class, 'generate']);
    Route::get('/qr/active', [AdminQrCodeController::class, 'active']);

    // 2FA
    Route::post('/2fa/setup', [AdminTwoFactorController::class, 'setup']);
    Route::post('/2fa/confirm', [AdminTwoFactorController::class, 'confirm']);
    Route::post('/2fa/disable', [AdminTwoFactorController::class, 'destroy']);
    Route::get('/2fa/status', [AdminTwoFactorController::class, 'status']);

    // Admin-only routes
    Route::middleware(AdminRoleMiddleware::class . ':admin')->group(function () {
        Route::get('/operators', [AdminSettingsController::class, 'operators']);
        Route::post('/operators', [AdminSettingsController::class, 'storeOperator']);
        Route::put('/operators/{id}', [AdminSettingsController::class, 'updateOperator']);
        Route::delete('/operators/{id}', [AdminSettingsController::class, 'destroyOperator']);
    });
});
