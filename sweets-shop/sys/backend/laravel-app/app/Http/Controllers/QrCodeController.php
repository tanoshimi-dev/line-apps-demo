<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\PointTransaction;
use App\Models\QrCode;
use App\Models\ReviewTicket;
use App\Services\LineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QrCodeController extends Controller
{
    public function __construct(private LineService $lineService)
    {
    }

    public function redeemEarnPoints(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $qrCode = QrCode::where('token', $validated['token'])
            ->where('type', 'earn_points')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$qrCode) {
            return response()->json([
                'error' => 'invalid_qr',
                'message' => 'Invalid or expired QR code',
            ], 400);
        }

        $member = Member::where('line_user_id', $request->line_user_id)->first();
        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        return DB::transaction(function () use ($qrCode, $member, $request) {
            $newBalance = $member->points_balance + $qrCode->points_amount;

            $member->update(['points_balance' => $newBalance]);

            $transaction = PointTransaction::create([
                'member_id' => $member->id,
                'type' => 'earn',
                'points' => $qrCode->points_amount,
                'balance_after' => $newBalance,
                'qr_token' => $qrCode->token,
                'staff_id' => $qrCode->admin_user_id,
            ]);

            $qrCode->update([
                'is_used' => true,
                'used_by_member_id' => $member->id,
            ]);

            // LINE push notification
            $this->lineService->pushMessage(
                $request->line_user_id,
                "🎉 {$qrCode->points_amount}ポイントが付与されました！\n現在のポイント残高: {$newBalance}pt"
            );

            return response()->json([
                'message' => 'Points earned successfully',
                'points_earned' => $qrCode->points_amount,
                'balance' => $newBalance,
                'transaction' => $transaction,
            ]);
        });
    }

    public function redeemSpendPoints(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'points' => 'required|integer|min:1',
        ]);

        $qrCode = QrCode::where('token', $validated['token'])
            ->where('type', 'spend_points')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$qrCode) {
            return response()->json([
                'error' => 'invalid_qr',
                'message' => 'Invalid or expired QR code',
            ], 400);
        }

        $member = Member::where('line_user_id', $request->line_user_id)->first();
        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        if ($member->points_balance < $validated['points']) {
            return response()->json([
                'error' => 'insufficient_points',
                'message' => 'Insufficient points balance',
                'balance' => $member->points_balance,
            ], 400);
        }

        return DB::transaction(function () use ($qrCode, $member, $validated, $request) {
            $newBalance = $member->points_balance - $validated['points'];

            $member->update(['points_balance' => $newBalance]);

            $transaction = PointTransaction::create([
                'member_id' => $member->id,
                'type' => 'spend',
                'points' => $validated['points'],
                'balance_after' => $newBalance,
                'qr_token' => $qrCode->token,
                'staff_id' => $qrCode->admin_user_id,
            ]);

            $qrCode->update([
                'is_used' => true,
                'used_by_member_id' => $member->id,
            ]);

            // LINE push notification
            $this->lineService->pushMessage(
                $request->line_user_id,
                "💳 {$validated['points']}ポイントを使用しました。\n現在のポイント残高: {$newBalance}pt"
            );

            return response()->json([
                'message' => 'Points spent successfully',
                'points_spent' => $validated['points'],
                'balance' => $newBalance,
                'transaction' => $transaction,
            ]);
        });
    }

    public function redeemReviewTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $qrCode = QrCode::where('token', $validated['token'])
            ->where('type', 'review_ticket')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$qrCode) {
            return response()->json([
                'error' => 'invalid_qr',
                'message' => 'Invalid or expired QR code',
            ], 400);
        }

        $member = Member::where('line_user_id', $request->line_user_id)->first();
        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        return DB::transaction(function () use ($qrCode, $member, $request) {
            $ticket = ReviewTicket::create([
                'member_id' => $member->id,
                'qr_token' => $qrCode->token,
                'issued_by' => $qrCode->admin_user_id,
            ]);

            $qrCode->update([
                'is_used' => true,
                'used_by_member_id' => $member->id,
            ]);

            // LINE push notification
            $this->lineService->pushMessage(
                $request->line_user_id,
                "📝 レビューチケットを取得しました！\nマイページからレビューを投稿できます。"
            );

            return response()->json([
                'message' => 'Review ticket acquired',
                'ticket' => $ticket,
            ]);
        });
    }
}
