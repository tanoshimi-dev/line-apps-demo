<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PointTransaction;
use App\Models\Review;
use App\Models\ReviewTicket;
use App\Models\SweetsItem;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'total_members' => Member::count(),
            'total_points_issued' => PointTransaction::where('type', 'earn')->sum('points'),
            'total_points_spent' => PointTransaction::where('type', 'spend')->sum('points'),
            'total_reviews' => Review::count(),
            'total_items' => SweetsItem::where('is_active', true)->count(),
            'pending_review_tickets' => ReviewTicket::where('is_used', false)->count(),
            'recent_transactions' => PointTransaction::with('member', 'staff')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'recent_reviews' => Review::with('member')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ]);
    }
}
