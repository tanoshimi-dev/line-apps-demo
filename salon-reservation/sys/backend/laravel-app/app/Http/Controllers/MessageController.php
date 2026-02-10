<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json([], 200);
        }

        $messages = Message::where('member_id', $member->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'direction' => $m->direction,
                    'content' => $m->content,
                    'created_at' => $m->created_at->toIso8601String(),
                ];
            });

        return response()->json($messages);
    }

    public function store(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json(['error' => 'not_found', 'message' => 'Please register first'], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'member_id' => $member->id,
            'direction' => 'member_to_salon',
            'content' => $validated['content'],
        ]);

        return response()->json($message, 201);
    }
}
