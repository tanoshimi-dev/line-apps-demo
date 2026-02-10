<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $services = Service::orderBy('sort_order')->get();

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'price' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $service = Service::create($validated);

        return response()->json($service, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'sometimes|required|integer|min:15|max:480',
            'price' => 'sometimes|required|integer|min:0',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $service->update($validated);

        return response()->json($service);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Service deleted successfully']);
    }
}
