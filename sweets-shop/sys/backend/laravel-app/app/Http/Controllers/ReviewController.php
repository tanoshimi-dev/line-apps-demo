<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Review;
use App\Models\ReviewTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'review_ticket_id' => 'required|uuid|exists:review_tickets,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        $ticket = ReviewTicket::where('id', $validated['review_ticket_id'])
            ->where('member_id', $member->id)
            ->where('is_used', false)
            ->first();

        if (!$ticket) {
            return response()->json([
                'error' => 'invalid_ticket',
                'message' => 'Invalid or already used review ticket',
            ], 400);
        }

        $review = Review::create([
            'member_id' => $member->id,
            'review_ticket_id' => $ticket->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        $ticket->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'review' => $review,
        ], 201);
    }

    public function myReviews(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if (!$member) {
            return response()->json([
                'error' => 'not_registered',
                'message' => 'Please register first',
            ], 400);
        }

        $reviews = Review::where('member_id', $member->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }
}
