<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->get('line_user_id'))->first();

        if (!$member) {
            return response()->json([
                'error' => 'not_found',
                'message' => 'Member not found',
            ], 404);
        }

        return response()->json($member);
    }

    public function register(Request $request): JsonResponse
    {
        $lineUserId = $request->get('line_user_id');

        $existing = Member::where('line_user_id', $lineUserId)->first();
        if ($existing) {
            return response()->json([
                'error' => 'conflict',
                'message' => 'Member already registered',
            ], 409);
        }

        $member = Member::create([
            'line_user_id' => $lineUserId,
            'display_name' => $request->get('line_display_name', ''),
            'picture_url' => $request->get('line_picture_url'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
        ]);

        return response()->json($member, 201);
    }
}
