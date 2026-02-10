<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\ReviewTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        $tickets = ReviewTicket::where('member_id', $member->id)
            ->with('review')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }
}
