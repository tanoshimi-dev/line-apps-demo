<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Member::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('display_name', 'like', "%{$search}%")
                    ->orWhere('member_number', 'like', "%{$search}%");
            });
        }

        if ($rank = $request->input('rank')) {
            $query->where('rank', $rank);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['created_at', 'display_name', 'points', 'rank'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min($request->input('per_page', 20), 100);
        $members = $query->paginate($perPage);

        return response()->json([
            'data' => collect($members->items())->map(function ($member) {
                return [
                    'id' => $member->id,
                    'display_name' => $member->display_name,
                    'member_number' => $member->member_number,
                    'points' => $member->points,
                    'rank' => $member->rank,
                    'picture_url' => $member->picture_url,
                    'created_at' => $member->created_at->toIso8601String(),
                ];
            }),
            'pagination' => [
                'current_page' => $members->currentPage(),
                'last_page' => $members->lastPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $member = Member::find($id);

        if (!$member) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Member not found',
            ], 404);
        }

        $history = $member->pointHistories()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($h) {
                return [
                    'id' => $h->id,
                    'type' => $h->type,
                    'points' => $h->points,
                    'balance' => $h->balance,
                    'reason' => $h->reason,
                    'created_at' => $h->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'member' => [
                'id' => $member->id,
                'line_user_id' => $member->line_user_id,
                'display_name' => $member->display_name,
                'member_number' => $member->member_number,
                'points' => $member->points,
                'rank' => $member->rank,
                'picture_url' => $member->picture_url,
                'created_at' => $member->created_at->toIso8601String(),
                'updated_at' => $member->updated_at->toIso8601String(),
            ],
            'point_history' => $history,
        ]);
    }
}
