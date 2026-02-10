<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminSettingsController extends Controller
{
    public function operators(): JsonResponse
    {
        $operators = AdminUser::orderBy('created_at', 'desc')->get();
        return response()->json($operators);
    }

    public function storeOperator(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|unique:admin_users,username',
            'password' => 'required|string|min:6',
            'name' => 'required|string|max:255',
            'role' => 'required|in:admin,staff',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $operator = AdminUser::create($validated);

        return response()->json($operator, 201);
    }

    public function updateOperator(Request $request, string $id): JsonResponse
    {
        $operator = AdminUser::findOrFail($id);

        $validated = $request->validate([
            'username' => 'sometimes|string|unique:admin_users,username,' . $id,
            'password' => 'nullable|string|min:6',
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:admin,staff',
            'is_active' => 'nullable|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $operator->update($validated);

        return response()->json($operator->fresh());
    }

    public function destroyOperator(string $id): JsonResponse
    {
        $operator = AdminUser::findOrFail($id);
        $operator->delete();

        return response()->json(['message' => 'Operator deleted successfully']);
    }
}
