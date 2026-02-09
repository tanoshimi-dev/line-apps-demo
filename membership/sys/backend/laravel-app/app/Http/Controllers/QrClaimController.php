<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\PointHistory;
use App\Models\QrSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QrClaimController extends Controller
{
    public function validateToken(Request $request, string $token): JsonResponse
    {
        $session = QrSession::where('token', $token)->first();

        if (!$session) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Invalid QR code',
            ], 404);
        }

        if ($session->isExpired()) {
            if ($session->isPending()) {
                $session->status = 'expired';
                $session->save();
            }
            return response()->json([
                'error' => 'Expired',
                'message' => 'This QR code has expired',
            ], 410);
        }

        if (!$session->isPending()) {
            return response()->json([
                'error' => 'Already used',
                'message' => 'This QR code has already been used',
            ], 409);
        }

        return response()->json([
            'type' => $session->type,
            'points' => $session->points,
            'status' => $session->status,
        ]);
    }

    public function claim(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string|size:64',
            'points' => 'nullable|integer|min:1|max:100000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $lineUserId = $request->input('line_user_id');
        $member = Member::where('line_user_id', $lineUserId)->first();

        if (!$member) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Member not found. Please register first.',
            ], 404);
        }

        $token = $request->input('token');

        return DB::transaction(function () use ($member, $token, $request) {
            $session = QrSession::where('token', $token)
                ->lockForUpdate()
                ->first();

            if (!$session) {
                return response()->json([
                    'error' => 'Not found',
                    'message' => 'Invalid QR code',
                ], 404);
            }

            if ($session->isExpired()) {
                if ($session->isPending()) {
                    $session->status = 'expired';
                    $session->save();
                }
                return response()->json([
                    'error' => 'Expired',
                    'message' => 'This QR code has expired',
                ], 410);
            }

            if (!$session->isPending()) {
                return response()->json([
                    'error' => 'Already used',
                    'message' => 'This QR code has already been used',
                ], 409);
            }

            if ($session->type === 'earn') {
                // Earn: add points to member
                $points = $session->points;
                $member->points += $points;
                $member->save();
                $member->updateRank();

                $history = PointHistory::create([
                    'member_id' => $member->id,
                    'type' => 'add',
                    'points' => $points,
                    'balance' => $member->points,
                    'reason' => $session->reason ?? 'QRコードによるポイント付与',
                    'qr_session_id' => $session->id,
                ]);

                $session->status = 'completed';
                $session->member_id = $member->id;
                $session->save();

                return response()->json([
                    'message' => 'Points earned successfully',
                    'type' => 'earn',
                    'points' => $points,
                    'new_balance' => $member->points,
                    'rank' => $member->rank,
                ]);
            } else {
                // Spend: deduct points from member
                $points = $request->input('points');

                if (!$points) {
                    return response()->json([
                        'error' => 'Validation failed',
                        'message' => 'Points amount is required for spend',
                    ], 422);
                }

                if ($member->points < $points) {
                    return response()->json([
                        'error' => 'Insufficient points',
                        'message' => 'Not enough points',
                        'current_balance' => $member->points,
                        'requested' => $points,
                    ], 400);
                }

                $member->points -= $points;
                $member->save();

                $history = PointHistory::create([
                    'member_id' => $member->id,
                    'type' => 'use',
                    'points' => $points,
                    'balance' => $member->points,
                    'reason' => 'QRコードによるポイント利用',
                    'qr_session_id' => $session->id,
                ]);

                $session->status = 'completed';
                $session->member_id = $member->id;
                $session->points = $points;
                $session->save();

                return response()->json([
                    'message' => 'Points spent successfully',
                    'type' => 'spend',
                    'points' => $points,
                    'new_balance' => $member->points,
                    'rank' => $member->rank,
                ]);
            }
        });
    }
}
