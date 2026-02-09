<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PointHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PointHistory::with('member');

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($memberId = $request->input('member_id')) {
            $query->where('member_id', $memberId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min($request->input('per_page', 20), 100);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'data' => collect($transactions->items())->map(function ($history) {
                return [
                    'id' => $history->id,
                    'member_id' => $history->member_id,
                    'member_name' => $history->member?->display_name ?? 'Unknown',
                    'member_number' => $history->member?->member_number ?? '',
                    'type' => $history->type,
                    'points' => $history->points,
                    'balance' => $history->balance,
                    'reason' => $history->reason,
                    'created_at' => $history->created_at->toIso8601String(),
                ];
            }),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }
}
