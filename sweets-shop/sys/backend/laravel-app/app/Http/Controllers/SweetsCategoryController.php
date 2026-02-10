<?php

namespace App\Http\Controllers;

use App\Models\SweetsCategory;
use Illuminate\Http\JsonResponse;

class SweetsCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = SweetsCategory::where('is_active', true)
            ->withCount(['items' => fn($q) => $q->where('is_active', true)])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function show(string $id): JsonResponse
    {
        $category = SweetsCategory::where('is_active', true)
            ->with(['items' => fn($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->findOrFail($id);

        return response()->json($category);
    }
}
