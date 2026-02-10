<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\StaffSchedule;
use App\Models\StaffScheduleException;
use App\Models\StaffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $staff = AdminUser::where('role', 'staff')
            ->with('services')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'username' => $s->username,
                    'specialty' => $s->specialty,
                    'bio' => $s->bio,
                    'avatar_url' => $s->avatar_url,
                    'is_active' => $s->is_active,
                    'services' => $s->services->map(function ($svc) {
                        return [
                            'id' => $svc->id,
                            'name' => $svc->name,
                        ];
                    }),
                ];
            });

        return response()->json($staff);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $staff = AdminUser::where('id', $id)
            ->where('role', 'staff')
            ->with(['services', 'schedules', 'scheduleExceptions' => function ($q) {
                $q->where('date', '>=', now()->toDateString())
                    ->orderBy('date');
            }])
            ->firstOrFail();

        return response()->json([
            'id' => $staff->id,
            'name' => $staff->name,
            'username' => $staff->username,
            'specialty' => $staff->specialty,
            'bio' => $staff->bio,
            'avatar_url' => $staff->avatar_url,
            'is_active' => $staff->is_active,
            'services' => $staff->services->map(function ($svc) {
                return [
                    'id' => $svc->id,
                    'name' => $svc->name,
                ];
            }),
            'schedules' => $staff->schedules->map(function ($sch) {
                return [
                    'id' => $sch->id,
                    'day_of_week' => $sch->day_of_week,
                    'start_time' => $sch->start_time,
                    'end_time' => $sch->end_time,
                    'is_available' => $sch->is_available,
                ];
            }),
            'exceptions' => $staff->scheduleExceptions->map(function ($ex) {
                return [
                    'id' => $ex->id,
                    'date' => $ex->date->toDateString(),
                    'start_time' => $ex->start_time,
                    'end_time' => $ex->end_time,
                    'is_available' => $ex->is_available,
                    'reason' => $ex->reason,
                ];
            }),
        ]);
    }

    public function updateProfile(Request $request, string $id): JsonResponse
    {
        $staff = AdminUser::where('id', $id)->where('role', 'staff')->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'specialty' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'avatar_url' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'service_ids' => 'sometimes|array',
            'service_ids.*' => 'uuid|exists:services,id',
        ]);

        $staff->update(collect($validated)->except('service_ids')->toArray());

        if ($request->has('service_ids')) {
            StaffService::where('admin_user_id', $id)->delete();
            foreach ($validated['service_ids'] as $serviceId) {
                StaffService::create([
                    'admin_user_id' => $id,
                    'service_id' => $serviceId,
                ]);
            }
        }

        return response()->json(['message' => 'Profile updated successfully']);
    }

    public function schedule(Request $request, string $id): JsonResponse
    {
        $staff = AdminUser::where('id', $id)->where('role', 'staff')->firstOrFail();

        $schedules = StaffSchedule::where('admin_user_id', $id)
            ->orderBy('day_of_week')
            ->get();

        return response()->json($schedules);
    }

    public function updateSchedule(Request $request, string $id): JsonResponse
    {
        $staff = AdminUser::where('id', $id)->where('role', 'staff')->firstOrFail();

        $validated = $request->validate([
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            'schedules.*.is_available' => 'required|boolean',
        ]);

        foreach ($validated['schedules'] as $scheduleData) {
            StaffSchedule::updateOrCreate(
                [
                    'admin_user_id' => $id,
                    'day_of_week' => $scheduleData['day_of_week'],
                ],
                [
                    'start_time' => $scheduleData['start_time'],
                    'end_time' => $scheduleData['end_time'],
                    'is_available' => $scheduleData['is_available'],
                ]
            );
        }

        return response()->json(['message' => 'Schedule updated successfully']);
    }

    public function addException(Request $request, string $id): JsonResponse
    {
        $staff = AdminUser::where('id', $id)->where('role', 'staff')->firstOrFail();

        $validated = $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_available' => 'required|boolean',
            'reason' => 'nullable|string|max:255',
        ]);

        $exception = StaffScheduleException::create([
            'admin_user_id' => $id,
            ...$validated,
        ]);

        return response()->json($exception, 201);
    }

    public function removeException(Request $request, string $id, string $eid): JsonResponse
    {
        $exception = StaffScheduleException::where('id', $eid)
            ->where('admin_user_id', $id)
            ->firstOrFail();

        $exception->delete();

        return response()->json(['message' => 'Exception removed successfully']);
    }
}
