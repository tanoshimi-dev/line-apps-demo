<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if (!$member) {
            return response()->json([
                'registered' => false,
                'line_user_id' => $request->line_user_id,
                'display_name' => $request->line_display_name,
                'picture_url' => $request->line_picture_url,
            ]);
        }

        return response()->json([
            'registered' => true,
            'member' => $member,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->line_user_id)->first();

        if ($member) {
            $member->update([
                'display_name' => $request->line_display_name,
                'picture_url' => $request->line_picture_url,
            ]);

            return response()->json([
                'message' => 'Member updated',
                'member' => $member->fresh(),
            ]);
        }

        $member = Member::create([
            'line_user_id' => $request->line_user_id,
            'display_name' => $request->line_display_name,
            'picture_url' => $request->line_picture_url,
            'points_balance' => 0,
        ]);

        return response()->json([
            'message' => 'Member registered',
            'member' => $member,
        ], 201);
    }
}
