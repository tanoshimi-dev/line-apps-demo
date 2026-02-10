<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SweetsItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSweetsItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SweetsItem::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $items = $query->orderBy('sort_order')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|uuid|exists:sweets_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'stock' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $data = collect($validated)->except('image')->toArray();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('items', 'public');
        }

        $item = SweetsItem::create($data);

        return response()->json($item->load('category'), 201);
    }

    public function show(string $id): JsonResponse
    {
        $item = SweetsItem::with('category')->findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = SweetsItem::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|uuid|exists:sweets_categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|integer|min:0',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'stock' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $data = collect($validated)->except('image')->toArray();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('items', 'public');
        }

        $item->update($data);

        return response()->json($item->fresh()->load('category'));
    }

    public function destroy(string $id): JsonResponse
    {
        $item = SweetsItem::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}
