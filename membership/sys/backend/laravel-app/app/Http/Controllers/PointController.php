<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\PointHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PointController extends Controller
{
    public function history(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->input('line_user_id'))->first();

        if (!$member) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Member not found',
            ], 404);
        }

        $perPage = min($request->input('per_page', 20), 100);

        $history = $member->pointHistories()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $history->items(),
            'pagination' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
            ],
        ]);
    }

    public function add(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'points' => 'required|integer|min:1|max:100000',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $member = Member::where('line_user_id', $request->input('line_user_id'))->first();

        if (!$member) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Member not found',
            ], 404);
        }

        $points = $request->input('points');
        $reason = $request->input('reason');

        DB::transaction(function () use ($member, $points, $reason) {
            $member->points += $points;
            $member->save();
            $member->updateRank();

            PointHistory::create([
                'member_id' => $member->id,
                'type' => 'add',
                'points' => $points,
                'balance' => $member->points,
                'reason' => $reason,
            ]);
        });

        return response()->json([
            'message' => 'Points added successfully',
            'points_added' => $points,
            'new_balance' => $member->points,
            'rank' => $member->rank,
        ]);
    }

    public function use(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'points' => 'required|integer|min:1|max:100000',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $member = Member::where('line_user_id', $request->input('line_user_id'))->first();

        if (!$member) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Member not found',
            ], 404);
        }

        $points = $request->input('points');
        $reason = $request->input('reason');

        if ($member->points < $points) {
            return response()->json([
                'error' => 'Insufficient points',
                'message' => 'Not enough points for this transaction',
                'current_balance' => $member->points,
                'requested' => $points,
            ], 400);
        }

        DB::transaction(function () use ($member, $points, $reason) {
            $member->points -= $points;
            $member->save();

            PointHistory::create([
                'member_id' => $member->id,
                'type' => 'use',
                'points' => $points,
                'balance' => $member->points,
                'reason' => $reason,
            ]);
        });

        return response()->json([
            'message' => 'Points used successfully',
            'points_used' => $points,
            'new_balance' => $member->points,
            'rank' => $member->rank,
        ]);
    }
}
