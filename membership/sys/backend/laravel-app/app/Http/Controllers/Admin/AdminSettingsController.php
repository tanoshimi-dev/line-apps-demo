<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminSettingsController extends Controller
{
    public function getSettings(Request $request): JsonResponse
    {
        return response()->json([
            'app_name' => config('app.name'),
            'points_per_scan' => 100,
            'qr_expiry_minutes' => 10,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        // Settings are currently config-based; this endpoint is a placeholder
        // for future DB-backed settings
        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    public function operatorIndex(Request $request): JsonResponse
    {
        $operators = AdminUser::orderBy('created_at', 'desc')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->toIso8601String(),
            ];
        });

        return response()->json(['data' => $operators]);
    }

    public function operatorStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|min:3|max:50|unique:admin_users,username',
            'password' => 'required|string|min:6|max:100',
            'name' => 'required|string|max:100',
            'role' => 'required|in:admin,operator',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $user = AdminUser::create([
            'username' => $request->input('username'),
            'password' => Hash::make($request->input('password')),
            'name' => $request->input('name'),
            'role' => $request->input('role'),
            'is_active' => true,
        ]);

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at->toIso8601String(),
        ], 201);
    }

    public function operatorUpdate(Request $request, string $id): JsonResponse
    {
        $user = AdminUser::find($id);

        if (!$user) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Operator not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|string|min:3|max:50|unique:admin_users,username,' . $id,
            'password' => 'sometimes|string|min:6|max:100',
            'name' => 'sometimes|string|max:100',
            'role' => 'sometimes|in:admin,operator',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        if ($request->has('username')) {
            $user->username = $request->input('username');
        }
        if ($request->has('password')) {
            $user->password = Hash::make($request->input('password'));
        }
        if ($request->has('name')) {
            $user->name = $request->input('name');
        }
        if ($request->has('role')) {
            $user->role = $request->input('role');
        }
        if ($request->has('is_active')) {
            $user->is_active = $request->input('is_active');
        }

        $user->save();

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at->toIso8601String(),
        ]);
    }

    public function operatorDestroy(Request $request, string $id): JsonResponse
    {
        $user = AdminUser::find($id);

        if (!$user) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Operator not found',
            ], 404);
        }

        // Prevent deleting yourself
        $currentAdmin = $request->input('admin_user');
        if ($currentAdmin->id === $user->id) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Cannot delete your own account',
            ], 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Operator deleted successfully',
        ]);
    }
}
