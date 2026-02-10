<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QrCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminQrCodeController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:earn_points,spend_points,review_ticket',
            'points_amount' => 'required_if:type,earn_points|nullable|integer|min:1',
        ]);

        $adminUser = $request->get('admin_user');

        $qrCode = QrCode::create([
            'admin_user_id' => $adminUser->id,
            'type' => $validated['type'],
            'token' => Str::random(64),
            'points_amount' => $validated['points_amount'] ?? null,
            'expires_at' => now()->addMinutes(30),
        ]);

        return response()->json($qrCode, 201);
    }

    public function active(): JsonResponse
    {
        $qrCodes = QrCode::with('adminUser')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($qrCodes);
    }
}
