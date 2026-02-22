<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AdminPasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Send OTP to admin's email
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email format',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find admin user by email
        $user = User::where('email', $request->email)
                    ->where('is_admin', true)
                    ->first();

        if (!$user) {
            // Security: Don't reveal if email exists or not
            return response()->json([
                'success' => true,
                'message' => 'If your email is registered, you will receive an OTP shortly.',
            ], 200);
        }

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP with 10-minute expiration
        $user->otp = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Send OTP via email
        try {
            Mail::to($user->email)->send(new AdminPasswordResetOtp($otp, $user->name));
        } catch (\Exception $e) {
            // Log error but don't expose to user
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again later.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP has been sent to your email address.',
        ], 200);
    }

    /**
     * Verify OTP and reset password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find admin user by email
        $user = User::where('email', $request->email)
                    ->where('is_admin', true)
                    ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 400);
        }

        // Check if OTP exists
        if (!$user->otp) {
            return response()->json([
                'success' => false,
                'message' => 'No OTP request found. Please request a new OTP.',
            ], 400);
        }

        // Check if OTP is expired
        if (Carbon::now()->isAfter($user->otp_expires_at)) {
            // Clear expired OTP
            $user->otp = null;
            $user->otp_expires_at = null;
            $user->save();

            return response()->json([
                'success' => false,
                'message' => 'OTP has expired. Please request a new one.',
            ], 400);
        }

        // Verify OTP
        if ($user->otp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP',
            ], 400);
        }

        // Update password and clear OTP
        $user->password = Hash::make($request->password);
        $user->otp = null;
        $user->otp_expires_at = null;
        $user->save();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully. Please login with your new password.',
        ], 200);
    }

    /**
     * Verify OTP only (optional - for two-step UI)
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)
                    ->where('is_admin', true)
                    ->first();

        if (!$user || !$user->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP',
            ], 400);
        }

        if (Carbon::now()->isAfter($user->otp_expires_at)) {
            $user->otp = null;
            $user->otp_expires_at = null;
            $user->save();

            return response()->json([
                'success' => false,
                'message' => 'OTP has expired',
            ], 400);
        }

        if ($user->otp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully',
        ], 200);
    }
}