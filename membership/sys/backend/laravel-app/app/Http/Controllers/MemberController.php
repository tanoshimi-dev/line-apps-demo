<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->input('line_user_id'))->first();

        if (!$member) {
            return response()->json([
                'registered' => false,
                'message' => 'Member not found',
            ], 404);
        }

        return response()->json([
            'registered' => true,
            'member' => [
                'id' => $member->id,
                'member_number' => $member->member_number,
                'display_name' => $member->display_name,
                'points' => $member->points,
                'rank' => $member->rank,
                'picture_url' => $member->picture_url,
                'created_at' => $member->created_at->toIso8601String(),
            ],
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $lineUserId = $request->input('line_user_id');

        // Check if already registered
        $existingMember = Member::where('line_user_id', $lineUserId)->first();

        if ($existingMember) {
            return response()->json([
                'error' => 'Already registered',
                'message' => 'This LINE account is already registered as a member',
            ], 409);
        }

        $member = Member::create([
            'line_user_id' => $lineUserId,
            'display_name' => $request->input('line_display_name') ?? 'Member',
            'member_number' => Member::generateMemberNumber(),
            'picture_url' => $request->input('line_picture_url'),
        ]);

        return response()->json([
            'message' => 'Registration successful',
            'member' => [
                'id' => $member->id,
                'member_number' => $member->member_number,
                'display_name' => $member->display_name,
                'points' => $member->points,
                'rank' => $member->rank,
                'picture_url' => $member->picture_url,
                'created_at' => $member->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function qrcode(Request $request): JsonResponse
    {
        $member = Member::where('line_user_id', $request->input('line_user_id'))->first();

        if (!$member) {
            return response()->json([
                'error' => 'Not found',
                'message' => 'Member not found',
            ], 404);
        }

        // Generate QR code data
        $qrData = json_encode([
            'type' => 'membership',
            'member_id' => $member->id,
            'member_number' => $member->member_number,
        ]);

        // Generate QR code as SVG (no imagick required)
        $qrCode = QrCode::size(300)
            ->margin(2)
            ->generate($qrData);

        $base64 = base64_encode($qrCode);

        return response()->json([
            'qr_code' => 'data:image/svg+xml;base64,' . $base64,
            'member_number' => $member->member_number,
        ]);
    }
}
