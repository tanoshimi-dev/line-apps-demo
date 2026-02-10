<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $totalMembers = Member::count();

        $todayStart = now()->startOfDay();
        $todayReservations = Reservation::whereDate('reservation_date', now()->toDateString())->count();

        $pendingReservations = Reservation::where('status', 'pending')->count();

        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();
        $weeklyReservations = Reservation::whereBetween('reservation_date', [$weekStart, $weekEnd])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();

        $reservationsByStatus = Reservation::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $todaySchedule = Reservation::with(['member', 'service', 'staff'])
            ->whereDate('reservation_date', now()->toDateString())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('start_time')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'start_time' => substr($r->start_time, 0, 5),
                    'end_time' => substr($r->end_time, 0, 5),
                    'status' => $r->status,
                    'member_name' => $r->member->display_name,
                    'service_name' => $r->service->name,
                    'staff_name' => $r->staff->name,
                ];
            });

        return response()->json([
            'total_members' => $totalMembers,
            'today_reservations' => $todayReservations,
            'pending_reservations' => $pendingReservations,
            'weekly_reservations' => $weeklyReservations,
            'reservations_by_status' => $reservationsByStatus,
            'today_schedule' => $todaySchedule,
        ]);
    }
}
