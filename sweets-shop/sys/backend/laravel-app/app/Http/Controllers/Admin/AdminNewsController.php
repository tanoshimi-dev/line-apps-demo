<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShopNews;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNewsController extends Controller
{
    public function index(): JsonResponse
    {
        $news = ShopNews::orderBy('created_at', 'desc')->get();
        return response()->json($news);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'is_published' => 'nullable|boolean',
        ]);

        $data = collect($validated)->except('image')->toArray();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('news', 'public');
        }

        if (!empty($data['is_published'])) {
            $data['published_at'] = now();
        }

        $news = ShopNews::create($data);

        return response()->json($news, 201);
    }

    public function show(string $id): JsonResponse
    {
        $news = ShopNews::findOrFail($id);
        return response()->json($news);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $news = ShopNews::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'is_published' => 'nullable|boolean',
        ]);

        $data = collect($validated)->except('image')->toArray();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('news', 'public');
        }

        if (isset($data['is_published']) && $data['is_published'] && !$news->published_at) {
            $data['published_at'] = now();
        }

        $news->update($data);

        return response()->json($news->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        $news = ShopNews::findOrFail($id);
        $news->delete();

        return response()->json(['message' => 'News deleted successfully']);
    }
}
