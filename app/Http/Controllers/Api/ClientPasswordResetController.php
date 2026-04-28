<?php
// ============================================================
// FILE 1: app/Http/Controllers/Api/ClientPasswordResetController.php
// ============================================================
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClientOtpMail;
use Carbon\Carbon;

class ClientPasswordResetController extends Controller
{
    // POST /api/client/forgot-password
    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)
            ->where('is_admin', 0)
            ->whereNotNull('email_verified_at')
            ->first();

        // Security: always return success to avoid email enumeration
        if (!$user) {
            return response()->json(['message' => 'If your email is registered, a reset code was sent.']);
        }

        $otp = rand(100000, 999999);

        $user->update([
            'otp_code'       => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user->email)->send(
            new ClientOtpMail((string) $otp, $user->first_name ?? $user->name)
        );

        return response()->json(['message' => 'If your email is registered, a reset code was sent.']);
    }

    // POST /api/client/verify-reset-otp
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string',
        ]);

        $user = User::where('email', $request->email)->where('is_admin', 0)->first();

        if (!$user || !$user->otp_code) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        if (!Hash::check($request->otp, $user->otp_code)) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        if (now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'Code expired. Please request a new one.'], 422);
        }

        return response()->json(['message' => 'Code verified.']);
    }

    // POST /api/client/reset-password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'otp'                   => 'required|string',
            'password'              => 'required|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->where('is_admin', 0)->first();

        if (!$user || !$user->otp_code) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        if (!Hash::check($request->otp, $user->otp_code)) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        if (now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'Code expired. Please request a new one.'], 422);
        }

        $user->password      = Hash::make($request->password);
        $user->otp_code      = null;
        $user->otp_expires_at = null;
        $user->save();

        // Revoke all existing tokens so stale sessions are cleared
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}

