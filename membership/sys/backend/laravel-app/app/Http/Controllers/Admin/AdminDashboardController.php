<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PointHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $totalMembers = Member::count();

        $totalPointsIssued = PointHistory::where('type', 'add')->sum('points');
        $totalPointsUsed = PointHistory::where('type', 'use')->sum('points');

        $todayStart = now()->startOfDay();
        $todayTransactions = PointHistory::where('created_at', '>=', $todayStart)->count();

        $membersByRank = Member::selectRaw('rank, count(*) as count')
            ->groupBy('rank')
            ->pluck('count', 'rank');

        $recentTransactions = PointHistory::with('member')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($history) {
                return [
                    'id' => $history->id,
                    'member_name' => $history->member?->display_name ?? 'Unknown',
                    'member_number' => $history->member?->member_number ?? '',
                    'type' => $history->type,
                    'points' => $history->points,
                    'balance' => $history->balance,
                    'reason' => $history->reason,
                    'created_at' => $history->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'total_members' => $totalMembers,
            'total_points_issued' => (int) $totalPointsIssued,
            'total_points_used' => (int) $totalPointsUsed,
            'today_transactions' => $todayTransactions,
            'members_by_rank' => [
                'bronze' => $membersByRank->get('bronze', 0),
                'silver' => $membersByRank->get('silver', 0),
                'gold' => $membersByRank->get('gold', 0),
                'platinum' => $membersByRank->get('platinum', 0),
            ],
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
