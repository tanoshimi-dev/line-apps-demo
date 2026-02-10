<?php

namespace App\Services;

use App\Models\AdminUser;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\StaffSchedule;
use App\Models\StaffScheduleException;
use Carbon\Carbon;

class AvailabilityService
{
    public function getAvailableSlots(string $staffId, string $date, string $serviceId): array
    {
        $service = Service::findOrFail($serviceId);
        $dateCarbon = Carbon::parse($date);
        $dayOfWeek = $dateCarbon->dayOfWeek;

        // Check for schedule exception on this date
        $exception = StaffScheduleException::where('admin_user_id', $staffId)
            ->whereDate('date', $date)
            ->first();

        if ($exception) {
            if (!$exception->is_available) {
                return [];
            }
            $startTime = $exception->start_time;
            $endTime = $exception->end_time;
        } else {
            // Get regular schedule for this day of week
            $schedule = StaffSchedule::where('admin_user_id', $staffId)
                ->where('day_of_week', $dayOfWeek)
                ->first();

            if (!$schedule || !$schedule->is_available) {
                return [];
            }

            $startTime = $schedule->start_time;
            $endTime = $schedule->end_time;
        }

        // Get existing reservations for this staff on this date
        $existingReservations = Reservation::where('admin_user_id', $staffId)
            ->whereDate('reservation_date', $date)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('start_time')
            ->get();

        // Generate available slots
        $slots = [];
        $durationMinutes = $service->duration_minutes;
        $current = Carbon::parse($date . ' ' . $startTime);
        $end = Carbon::parse($date . ' ' . $endTime);

        while ($current->copy()->addMinutes($durationMinutes)->lte($end)) {
            $slotEnd = $current->copy()->addMinutes($durationMinutes);

            // Check if slot overlaps with any existing reservation
            $overlaps = false;
            foreach ($existingReservations as $reservation) {
                $resStart = Carbon::parse($date . ' ' . $reservation->start_time);
                $resEnd = Carbon::parse($date . ' ' . $reservation->end_time);

                if ($current->lt($resEnd) && $slotEnd->gt($resStart)) {
                    $overlaps = true;
                    break;
                }
            }

            if (!$overlaps) {
                $slots[] = [
                    'start_time' => $current->format('H:i'),
                    'end_time' => $slotEnd->format('H:i'),
                ];
            }

            $current->addMinutes(30); // 30-minute intervals
        }

        return $slots;
    }
}
