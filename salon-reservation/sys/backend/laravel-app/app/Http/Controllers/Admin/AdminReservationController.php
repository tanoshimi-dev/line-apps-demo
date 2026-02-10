<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Services\LineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReservationController extends Controller
{
    public function __construct(private LineService $lineService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Reservation::with(['member', 'service', 'staff']);

        if ($request->has('date')) {
            $query->whereDate('reservation_date', $request->query('date'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('staff_id')) {
            $query->where('admin_user_id', $request->query('staff_id'));
        }

        $reservations = $query->orderBy('reservation_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate(20);

        $reservations->getCollection()->transform(function ($r) {
            return [
                'id' => $r->id,
                'reservation_date' => $r->reservation_date->toDateString(),
                'start_time' => substr($r->start_time, 0, 5),
                'end_time' => substr($r->end_time, 0, 5),
                'status' => $r->status,
                'notes' => $r->notes,
                'member' => [
                    'id' => $r->member->id,
                    'display_name' => $r->member->display_name,
                    'phone' => $r->member->phone,
                ],
                'service' => [
                    'id' => $r->service->id,
                    'name' => $r->service->name,
                    'price' => $r->service->price,
                ],
                'staff' => [
                    'id' => $r->staff->id,
                    'name' => $r->staff->name,
                ],
                'created_at' => $r->created_at->toIso8601String(),
            ];
        });

        return response()->json($reservations);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $reservation = Reservation::with(['member', 'service', 'staff'])->findOrFail($id);

        return response()->json([
            'id' => $reservation->id,
            'reservation_date' => $reservation->reservation_date->toDateString(),
            'start_time' => substr($reservation->start_time, 0, 5),
            'end_time' => substr($reservation->end_time, 0, 5),
            'status' => $reservation->status,
            'notes' => $reservation->notes,
            'cancel_reason' => $reservation->cancel_reason,
            'cancelled_at' => $reservation->cancelled_at?->toIso8601String(),
            'member' => [
                'id' => $reservation->member->id,
                'display_name' => $reservation->member->display_name,
                'phone' => $reservation->member->phone,
                'email' => $reservation->member->email,
                'line_user_id' => $reservation->member->line_user_id,
            ],
            'service' => [
                'id' => $reservation->service->id,
                'name' => $reservation->service->name,
                'duration_minutes' => $reservation->service->duration_minutes,
                'price' => $reservation->service->price,
            ],
            'staff' => [
                'id' => $reservation->staff->id,
                'name' => $reservation->staff->name,
            ],
            'created_at' => $reservation->created_at->toIso8601String(),
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,in_progress,completed,cancelled,no_show',
            'cancel_reason' => 'nullable|string|max:500',
        ]);

        $reservation = Reservation::with('member')->findOrFail($id);

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'cancelled') {
            $updateData['cancel_reason'] = $validated['cancel_reason'] ?? 'サロンによるキャンセル';
            $updateData['cancelled_at'] = now();

            // Notify member via LINE
            $this->lineService->pushMessage(
                $reservation->member->line_user_id,
                "ご予約がキャンセルされました。\n" .
                "日時: {$reservation->reservation_date->format('Y/m/d')} " . substr($reservation->start_time, 0, 5) . "\n" .
                "理由: " . ($validated['cancel_reason'] ?? 'サロンの都合によるキャンセル')
            );
        } elseif ($validated['status'] === 'confirmed') {
            $this->lineService->pushMessage(
                $reservation->member->line_user_id,
                "ご予約が確認されました。\n" .
                "日時: {$reservation->reservation_date->format('Y/m/d')} " . substr($reservation->start_time, 0, 5) . "\n" .
                "ご来店をお待ちしております。"
            );
        }

        $reservation->update($updateData);

        return response()->json(['message' => 'Status updated successfully', 'status' => $validated['status']]);
    }
}
