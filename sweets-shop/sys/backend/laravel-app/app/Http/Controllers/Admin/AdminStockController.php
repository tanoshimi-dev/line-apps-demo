<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SweetsItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStockController extends Controller
{
    public function updateStock(Request $request, string $id): JsonResponse
    {
        $item = SweetsItem::findOrFail($id);

        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $item->update(['stock' => $validated['stock']]);

        return response()->json($item->fresh());
    }
}
