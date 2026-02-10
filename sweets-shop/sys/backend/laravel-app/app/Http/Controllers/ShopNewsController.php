<?php

namespace App\Http\Controllers;

use App\Models\ShopNews;
use Illuminate\Http\JsonResponse;

class ShopNewsController extends Controller
{
    public function index(): JsonResponse
    {
        $news = ShopNews::where('is_published', true)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json($news);
    }

    public function show(string $id): JsonResponse
    {
        $news = ShopNews::where('is_published', true)->findOrFail($id);
        return response()->json($news);
    }
}
