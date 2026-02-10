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

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('display_name', 'like', "%{$search}%");
        }

        $members = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($members);
    }

    public function show(string $id): JsonResponse
    {
        $member = Member::with([
            'pointTransactions' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
            'pointTransactions.staff',
            'reviewTickets' => fn($q) => $q->orderBy('created_at', 'desc'),
            'reviewTickets.issuedByAdmin',
            'reviews' => fn($q) => $q->orderBy('created_at', 'desc'),
        ])->findOrFail($id);

        return response()->json($member);
    }
}
