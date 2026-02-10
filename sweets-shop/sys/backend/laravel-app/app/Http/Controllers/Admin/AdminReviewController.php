<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::with('member', 'reviewTicket');

        if ($request->has('is_visible')) {
            $query->where('is_visible', $request->boolean('is_visible'));
        }

        $reviews = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($reviews);
    }

    public function updateVisibility(Request $request, string $id): JsonResponse
    {
        $review = Review::findOrFail($id);

        $validated = $request->validate([
            'is_visible' => 'required|boolean',
        ]);

        $review->update(['is_visible' => $validated['is_visible']]);

        return response()->json($review->fresh());
    }
}
