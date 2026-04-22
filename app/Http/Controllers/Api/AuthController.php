<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClientOtpMail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email',
            'password'   => 'required|min:8',
        ]);

        $otp = rand(100000, 999999);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Already verified → block
            if ($user->email_verified_at) {
                return response()->json([
                    'message' => 'Email already registered.'
                ], 422);
            }

            // Admin email → block
            if ($user->is_admin) {
                return response()->json([
                    'message' => 'This email is not available for client registration.'
                ], 403);
            }

            // Unverified → refresh OTP + update name
            $user->update([
                'name'           => $request->first_name . ' ' . $request->last_name,
                'first_name'     => $request->first_name,
                'last_name'      => $request->last_name,
                'password'       => Hash::make($request->password),
                'otp_code'       => Hash::make($otp),
                'otp_expires_at' => now()->addMinutes(5),
            ]);

        } else {
            // New user — always is_admin = 0
            $user = User::create([
                'name'           => $request->first_name . ' ' . $request->last_name,
                'first_name'     => $request->first_name,
                'last_name'      => $request->last_name,
                'email'          => $request->email,
                'password'       => Hash::make($request->password),
                'is_admin'       => 0,   // ← always non-admin
                'otp_code'       => Hash::make($otp),
                'otp_expires_at' => now()->addMinutes(5),
            ]);
        }

        Mail::to($user->email)->send(
            new ClientOtpMail((string) $otp, $user->first_name ?? $user->name)
        );

        return response()->json([
            'message' => 'OTP sent.',
            'email'   => $user->email,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Block admins from this endpoint
        if ($user->is_admin) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$user->otp_code) {
            return response()->json(['message' => 'No OTP requested.'], 422);
        }

        if (!Hash::check($request->otp, $user->otp_code)) {
            return response()->json(['message' => 'Invalid OTP.'], 422);
        }

        if (now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'OTP expired.'], 422);
        }

        $user->email_verified_at = now();
        $user->otp_code          = null;
        $user->otp_expires_at    = null;
        $user->save();

        $token = $user->createToken('client_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        // Wrong credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Admins must use /api/admin/login
        if ($user->is_admin) {
            return response()->json([
                'message' => 'Admin accounts must use the admin portal.'
            ], 403);
        }

        // Unverified → send back to OTP screen
        if (!$user->email_verified_at) {
            return response()->json([
                'message'      => 'Please verify your email first.',
                'requires_otp' => true,
                'email'        => $user->email,
            ], 403);
        }

        $token = $user->createToken('client_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out.']);
    }
}