<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Message;
use App\Services\LineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMessageController extends Controller
{
    public function __construct(private LineService $lineService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|uuid|exists:members,id',
            'content' => 'required|string|max:1000',
        ]);

        $adminUser = $request->get('admin_user');
        $member = Member::findOrFail($validated['member_id']);

        $message = Message::create([
            'member_id' => $validated['member_id'],
            'admin_user_id' => $adminUser->id,
            'direction' => 'salon_to_member',
            'content' => $validated['content'],
            'sent_via_line' => false,
        ]);

        // Try to send via LINE
        $sent = $this->lineService->pushMessage($member->line_user_id, $validated['content']);
        if ($sent) {
            $message->update(['sent_via_line' => true]);
        }

        return response()->json($message, 201);
    }

    public function history(Request $request, string $memberId): JsonResponse
    {
        $member = Member::findOrFail($memberId);

        $messages = Message::where('member_id', $memberId)
            ->with('adminUser')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'direction' => $m->direction,
                    'content' => $m->content,
                    'sent_via_line' => $m->sent_via_line,
                    'admin_user_name' => $m->adminUser?->name,
                    'created_at' => $m->created_at->toIso8601String(),
                ];
            });

        return response()->json($messages);
    }
}
