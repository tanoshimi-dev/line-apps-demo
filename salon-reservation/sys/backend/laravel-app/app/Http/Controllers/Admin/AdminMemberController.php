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
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('display_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $members = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($members);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $member = Member::findOrFail($id);

        $reservations = $member->reservations()
            ->with(['service', 'staff'])
            ->orderBy('reservation_date', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'reservation_date' => $r->reservation_date->toDateString(),
                    'start_time' => substr($r->start_time, 0, 5),
                    'end_time' => substr($r->end_time, 0, 5),
                    'status' => $r->status,
                    'service_name' => $r->service->name,
                    'staff_name' => $r->staff->name,
                    'created_at' => $r->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'id' => $member->id,
            'line_user_id' => $member->line_user_id,
            'display_name' => $member->display_name,
            'picture_url' => $member->picture_url,
            'phone' => $member->phone,
            'email' => $member->email,
            'created_at' => $member->created_at->toIso8601String(),
            'reservations' => $reservations,
        ]);
    }
}
