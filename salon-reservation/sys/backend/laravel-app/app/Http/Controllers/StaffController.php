<?php

namespace App\Http\Controllers;

use App\Models\AdminUser;
use App\Services\AvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(private AvailabilityService $availabilityService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = AdminUser::where('role', 'staff')
            ->where('is_active', true);

        if ($request->has('service_id')) {
            $query->whereHas('services', function ($q) use ($request) {
                $q->where('services.id', $request->query('service_id'));
            });
        }

        $staff = $query->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'specialty' => $s->specialty,
                'bio' => $s->bio,
                'avatar_url' => $s->avatar_url,
            ];
        });

        return response()->json($staff);
    }

    public function availability(Request $request, string $id): JsonResponse
    {
        $staff = AdminUser::where('id', $id)
            ->where('role', 'staff')
            ->where('is_active', true)
            ->firstOrFail();

        $date = $request->query('date', now()->toDateString());
        $serviceId = $request->query('service_id');

        if (!$serviceId) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'service_id is required',
            ], 422);
        }

        $slots = $this->availabilityService->getAvailableSlots($id, $date, $serviceId);

        return response()->json([
            'staff_id' => $id,
            'date' => $date,
            'service_id' => $serviceId,
            'slots' => $slots,
        ]);
    }
}
