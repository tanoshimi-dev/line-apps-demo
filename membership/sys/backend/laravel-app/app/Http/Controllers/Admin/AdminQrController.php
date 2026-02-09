<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QrSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminQrController extends Controller
{
    public function createSpend(Request $request): JsonResponse
    {
        $adminUser = $request->input('admin_user');

        $session = QrSession::create([
            'admin_user_id' => $adminUser->id,
            'type' => 'spend',
            'points' => null,
            'token' => Str::random(64),
            'status' => 'pending',
            'expires_at' => now()->addMinutes(10),
        ]);

        $qrData = json_encode(['type' => 'spend', 'token' => $session->token]);

        return response()->json([
            'id' => $session->id,
            'type' => $session->type,
            'status' => $session->status,
            'qr_data' => $qrData,
            'expires_at' => $session->expires_at->toIso8601String(),
        ]);
    }

    public function createEarn(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'points' => 'required|integer|min:1|max:100000',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $adminUser = $request->input('admin_user');

        $session = QrSession::create([
            'admin_user_id' => $adminUser->id,
            'type' => 'earn',
            'points' => $request->input('points'),
            'token' => Str::random(64),
            'status' => 'pending',
            'reason' => $request->input('reason', 'ポイント付与'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $qrData = json_encode(['type' => 'earn', 'token' => $session->token]);

        return response()->json([
            'id' => $session->id,
            'type' => $session->type,
            'points' => $session->points,
            'status' => $session->status,
            'qr_data' => $qrData,
            'expires_at' => $session->expires_at->toIso8601String(),
        ]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $query = QrSession::with(['member', 'adminUser'])
            ->orderBy('created_at', 'desc');

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = min($request->input('per_page', 20), 100);
        $sessions = $query->paginate($perPage);

        return response()->json([
            'data' => collect($sessions->items())->map(function ($session) {
                return [
                    'id' => $session->id,
                    'type' => $session->type,
                    'points' => $session->points,
                    'status' => $session->status,
                    'member_name' => $session->member?->display_name,
                    'admin_name' => $session->adminUser?->name,
                    'reason' => $session->reason,
                    'created_at' => $session->created_at->toIso8601String(),
                    'expires_at' => $session->expires_at->toIso8601String(),
                ];
            }),
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $session = QrSession::with(['member', 'adminUser'])->find($id);

        if (!$session) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'QR session not found',
            ], 404);
        }

        // Auto-expire if past expiry
        if ($session->isPending() && $session->isExpired()) {
            $session->status = 'expired';
            $session->save();
        }

        return response()->json([
            'id' => $session->id,
            'type' => $session->type,
            'points' => $session->points,
            'status' => $session->status,
            'member_name' => $session->member?->display_name,
            'member_number' => $session->member?->member_number,
            'admin_name' => $session->adminUser?->name,
            'reason' => $session->reason,
            'created_at' => $session->created_at->toIso8601String(),
            'expires_at' => $session->expires_at->toIso8601String(),
        ]);
    }
}
