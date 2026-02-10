<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SweetsCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSweetsCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = SweetsCategory::withCount('items')
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $data = collect($validated)->except('image')->toArray();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('categories', 'public');
        }

        $category = SweetsCategory::create($data);

        return response()->json($category, 201);
    }

    public function show(string $id): JsonResponse
    {
        $category = SweetsCategory::withCount('items')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = SweetsCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $data = collect($validated)->except('image')->toArray();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return response()->json($category->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        $category = SweetsCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
