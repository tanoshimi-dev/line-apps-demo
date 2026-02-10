<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminSettingsController extends Controller
{
    public function getSettings(Request $request): JsonResponse
    {
        return response()->json([
            'app_name' => config('app.name'),
            'timezone' => config('app.timezone'),
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Settings updated']);
    }

    public function operatorIndex(Request $request): JsonResponse
    {
        $operators = AdminUser::where('role', 'staff')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($op) {
                return [
                    'id' => $op->id,
                    'username' => $op->username,
                    'name' => $op->name,
                    'role' => $op->role,
                    'is_active' => $op->is_active,
                    'two_factor_enabled' => $op->two_factor_enabled,
                    'created_at' => $op->created_at->toIso8601String(),
                ];
            });

        return response()->json($operators);
    }

    public function operatorStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|unique:admin_users,username',
            'password' => 'required|string|min:6',
            'name' => 'required|string|max:255',
            'specialty' => 'nullable|string|max:255',
        ]);

        $operator = AdminUser::create([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'name' => $validated['name'],
            'role' => 'staff',
            'is_active' => true,
            'specialty' => $validated['specialty'] ?? null,
        ]);

        return response()->json($operator, 201);
    }

    public function operatorUpdate(Request $request, string $id): JsonResponse
    {
        $operator = AdminUser::where('id', $id)->where('role', 'staff')->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'password' => 'nullable|string|min:6',
            'is_active' => 'boolean',
            'specialty' => 'nullable|string|max:255',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $operator->update($validated);

        return response()->json(['message' => 'Operator updated successfully']);
    }

    public function operatorDestroy(Request $request, string $id): JsonResponse
    {
        $operator = AdminUser::where('id', $id)->where('role', 'staff')->firstOrFail();
        $operator->delete();

        return response()->json(['message' => 'Operator deleted successfully']);
    }
}
