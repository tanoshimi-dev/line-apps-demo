<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReviewTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReviewTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ReviewTicket::with('member', 'issuedByAdmin', 'review');

        if ($request->has('is_used')) {
            $query->where('is_used', $request->boolean('is_used'));
        }

        $tickets = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($tickets);
    }
}
