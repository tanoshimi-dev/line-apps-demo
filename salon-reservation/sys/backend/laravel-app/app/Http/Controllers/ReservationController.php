<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\StaffService;
use App\Services\AvailabilityService;
use App\Services\LineService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    public function __construct(
        private AvailabilityService $availabilityService,
        private LineService $lineService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json([], 200);
        }

        $query = Reservation::where('member_id', $member->id)
            ->with(['staff', 'service']);

        $status = $request->query('status');
        if ($status === 'upcoming') {
            $query->where(function ($q) {
                $q->whereDate('reservation_date', '>', now()->toDateString())
                    ->orWhere(function ($q2) {
                        $q2->whereDate('reservation_date', now()->toDateString())
                            ->whereTime('start_time', '>=', now()->format('H:i:s'));
                    });
            })->whereIn('status', ['pending', 'confirmed']);
        } elseif ($status === 'past') {
            $query->where(function ($q) {
                $q->whereDate('reservation_date', '<', now()->toDateString())
                    ->orWhereIn('status', ['completed', 'cancelled', 'no_show']);
            });
        }

        $reservations = $query->orderBy('reservation_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'reservation_date' => $r->reservation_date->toDateString(),
                    'start_time' => substr($r->start_time, 0, 5),
                    'end_time' => substr($r->end_time, 0, 5),
                    'status' => $r->status,
                    'notes' => $r->notes,
                    'cancel_reason' => $r->cancel_reason,
                    'staff' => [
                        'id' => $r->staff->id,
                        'name' => $r->staff->name,
                        'avatar_url' => $r->staff->avatar_url,
                    ],
                    'service' => [
                        'id' => $r->service->id,
                        'name' => $r->service->name,
                        'duration_minutes' => $r->service->duration_minutes,
                        'price' => $r->service->price,
                    ],
                    'created_at' => $r->created_at->toIso8601String(),
                ];
            });

        return response()->json($reservations);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json(['error' => 'not_found', 'message' => 'Member not found'], 404);
        }

        $reservation = Reservation::where('id', $id)
            ->where('member_id', $member->id)
            ->with(['staff', 'service'])
            ->first();

        if (!$reservation) {
            return response()->json(['error' => 'not_found', 'message' => 'Reservation not found'], 404);
        }

        return response()->json([
            'id' => $reservation->id,
            'reservation_date' => $reservation->reservation_date->toDateString(),
            'start_time' => substr($reservation->start_time, 0, 5),
            'end_time' => substr($reservation->end_time, 0, 5),
            'status' => $reservation->status,
            'notes' => $reservation->notes,
            'cancel_reason' => $reservation->cancel_reason,
            'cancelled_at' => $reservation->cancelled_at?->toIso8601String(),
            'staff' => [
                'id' => $reservation->staff->id,
                'name' => $reservation->staff->name,
                'specialty' => $reservation->staff->specialty,
                'avatar_url' => $reservation->staff->avatar_url,
            ],
            'service' => [
                'id' => $reservation->service->id,
                'name' => $reservation->service->name,
                'description' => $reservation->service->description,
                'duration_minutes' => $reservation->service->duration_minutes,
                'price' => $reservation->service->price,
            ],
            'created_at' => $reservation->created_at->toIso8601String(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json(['error' => 'not_found', 'message' => 'Please register first'], 404);
        }

        $validated = $request->validate([
            'service_id' => 'required|uuid|exists:services,id',
            'staff_id' => 'required|uuid|exists:admin_users,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string|max:500',
        ]);

        $service = Service::findOrFail($validated['service_id']);

        // Verify staff can perform this service
        $canPerform = StaffService::where('admin_user_id', $validated['staff_id'])
            ->where('service_id', $validated['service_id'])
            ->exists();

        if (!$canPerform) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'Selected staff cannot perform this service',
            ], 422);
        }

        // Calculate end time
        $startTime = Carbon::parse($validated['date'] . ' ' . $validated['start_time']);
        $endTime = $startTime->copy()->addMinutes($service->duration_minutes);

        // Verify slot is available using DB transaction with lock
        $reservation = DB::transaction(function () use ($member, $validated, $service, $startTime, $endTime) {
            // Lock check for overlapping reservations
            $overlapping = Reservation::where('admin_user_id', $validated['staff_id'])
                ->whereDate('reservation_date', $validated['date'])
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->where(function ($q2) use ($startTime, $endTime) {
                        $q2->whereTime('start_time', '<', $endTime->format('H:i:s'))
                            ->whereTime('end_time', '>', $startTime->format('H:i:s'));
                    });
                })
                ->lockForUpdate()
                ->exists();

            if ($overlapping) {
                return null;
            }

            return Reservation::create([
                'member_id' => $member->id,
                'admin_user_id' => $validated['staff_id'],
                'service_id' => $validated['service_id'],
                'reservation_date' => $validated['date'],
                'start_time' => $startTime->format('H:i'),
                'end_time' => $endTime->format('H:i'),
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        if (!$reservation) {
            return response()->json([
                'error' => 'conflict',
                'message' => 'Selected time slot is no longer available',
            ], 409);
        }

        // Send LINE push notification
        $this->lineService->pushMessage(
            $member->line_user_id,
            "予約を受け付けました。\n" .
            "日時: {$validated['date']} {$validated['start_time']}\n" .
            "メニュー: {$service->name}\n" .
            "確認後、改めてご連絡いたします。"
        );

        return response()->json($reservation->load(['staff', 'service']), 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json(['error' => 'not_found', 'message' => 'Member not found'], 404);
        }

        $reservation = Reservation::where('id', $id)
            ->where('member_id', $member->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if (!$reservation) {
            return response()->json(['error' => 'not_found', 'message' => 'Reservation not found or cannot be cancelled'], 404);
        }

        $reservation->update([
            'status' => 'cancelled',
            'cancel_reason' => $request->input('reason', 'お客様によるキャンセル'),
            'cancelled_at' => now(),
        ]);

        return response()->json(['message' => 'Reservation cancelled successfully']);
    }
}
