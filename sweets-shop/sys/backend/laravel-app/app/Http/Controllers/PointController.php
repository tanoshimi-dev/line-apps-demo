<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\PointTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PointController extends Controller
{
    public function balance(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        return response()->json([
            'balance' => $member->points_balance,
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        $transactions = PointTransaction::where('member_id', $member->id)
            ->with('staff')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($transactions);
    }
}
