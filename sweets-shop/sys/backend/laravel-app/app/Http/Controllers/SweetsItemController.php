<?php

namespace App\Http\Controllers;

use App\Models\SweetsItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SweetsItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SweetsItem::with('category')->where('is_active', true);

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $items = $query->orderBy('sort_order')->get();

        return response()->json($items);
    }

    public function show(string $id): JsonResponse
    {
        $item = SweetsItem::with('category')
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json($item);
    }
}
