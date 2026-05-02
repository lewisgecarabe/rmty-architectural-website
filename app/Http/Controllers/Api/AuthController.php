<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClientOtpMail;

class AuthController extends Controller
{
    // ── Constants ──────────────────────────────────────────────────────────
    private const MAX_LOGIN_ATTEMPTS     = 5;
    private const RESET_COOLDOWN_SECS    = 60;
    private const PASSWORD_HISTORY_COUNT = 5;

    // ── Register ───────────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email',
            'password'   => 'required|min:8',
        ]);

        $otp  = rand(100000, 999999);
        $user = User::where('email', $request->email)->first();

        if ($user) {
            if ($user->email_verified_at) {
                return response()->json(['message' => 'Email already registered.'], 422);
            }
            if ($user->isAdmin()) {
                return response()->json(['message' => 'This email is not available for client registration.'], 403);
            }

            // Unverified → refresh OTP
            $user->update([
                'name'           => $request->first_name . ' ' . $request->last_name,
                'first_name'     => $request->first_name,
                'last_name'      => $request->last_name,
                'password'       => Hash::make($request->password),
                'otp_code'       => Hash::make($otp),
                'otp_expires_at' => now()->addMinutes(5),
            ]);

        } else {
            $user = User::create([
                'name'           => $request->first_name . ' ' . $request->last_name,
                'first_name'     => $request->first_name,
                'last_name'      => $request->last_name,
                'email'          => $request->email,
                'password'       => Hash::make($request->password),
                'is_admin'       => 0,
                'role'           => 'customer',   // ← always customer on self-register
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

    // ── Verify OTP (registration) ──────────────────────────────────────────

    public function verifyOtp(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if (! $user->otp_code) {
            return response()->json(['message' => 'No OTP requested.'], 422);
        }
        if (! Hash::check($request->otp, $user->otp_code)) {
            return response()->json(['message' => 'Invalid OTP.'], 422);
        }
        if (now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'OTP expired.'], 422);
        }

        $user->email_verified_at = now();
        $user->otp_code          = null;
        $user->otp_expires_at    = null;
        $user->save();

        // Seed password history on first verification
        $user->pushPasswordHistory();

        $token = $user->createToken('client_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    // ── Login ──────────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        // Unknown email — still increment nothing, just return generic error
        if (! $user) {
            Log::warning('Login failed: unknown email', [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Account locked?
        if ($user->isLocked()) {
            $remaining = $user->lockoutSecondsRemaining();
            Log::warning('Login blocked: account locked', ['email' => $user->email, 'ip' => $request->ip()]);
            return response()->json([
                'message'            => 'Account temporarily locked due to too many failed attempts. Please try again later.',
                'retry_after_seconds' => $remaining,
            ], 429);
        }

        // Wrong password
        if (! Hash::check($request->password, $user->password)) {
            $user->incrementLoginAttempts();
            $attemptsLeft = max(0, self::MAX_LOGIN_ATTEMPTS - $user->login_attempts);

            Log::warning('Login failed: wrong password', [
                'email'         => $user->email,
                'ip'            => $request->ip(),
                'attempts_so_far' => $user->login_attempts,
            ]);

            if ($user->isLocked()) {
                return response()->json([
                    'message'            => 'Account temporarily locked due to too many failed attempts. Try again in 1 minute.',
                    'retry_after_seconds' => $user->lockoutSecondsRemaining(),
                ], 429);
            }

            return response()->json([
                'message'       => 'Invalid credentials.',
                'attempts_left' => $attemptsLeft,
            ], 401);
        }

        // Admins → separate portal
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Admin accounts must use the admin portal.'], 403);
        }

        // Unverified → redirect to OTP
        if (! $user->email_verified_at) {
            return response()->json([
                'message'      => 'Please verify your email first.',
                'requires_otp' => true,
                'email'        => $user->email,
            ], 403);
        }

        // Success — reset lockout counter
        $user->resetLoginAttempts();

        Log::info('Login successful', ['email' => $user->email, 'ip' => $request->ip()]);

        $token = $user->createToken('client_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    // ── Logout ─────────────────────────────────────────────────────────────

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    // ── Forgot Password: send OTP ──────────────────────────────────────────

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // ① Email not registered — generic message, no info leak
        if (! $user || $user->isAdmin()) {
            Log::warning('Password reset requested for unknown/admin email', [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);
            return response()->json(['message' => 'Unable to process request.'], 422);
        }

        // ② Throttle — 1 request per RESET_COOLDOWN_SECS seconds
        if (! $user->canRequestReset(self::RESET_COOLDOWN_SECS)) {
            $wait = self::RESET_COOLDOWN_SECS - now()->diffInSeconds($user->last_reset_request_at);
            Log::warning('Password reset throttled', ['email' => $user->email, 'ip' => $request->ip()]);
            return response()->json([
                'message'      => 'Please wait before requesting another reset.',
                'retry_after'  => max(0, (int) $wait),
            ], 429);
        }

        $otp = rand(100000, 999999);

        $user->update([
            'otp_code'              => Hash::make($otp),
            'otp_expires_at'        => now()->addMinutes(5),
            'last_reset_request_at' => now(),
        ]);

        Mail::to($user->email)->send(
            new ClientOtpMail((string) $otp, $user->first_name ?? $user->name)
        );

        Log::info('Password reset OTP sent', ['email' => $user->email, 'ip' => $request->ip()]);

        return response()->json(['message' => 'Reset code sent to your email.']);
    }

    // ── Forgot Password: verify OTP ───────────────────────────────────────

    public function verifyResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|digits:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || $user->isAdmin()) {
            return response()->json(['message' => 'Unable to process request.'], 422);
        }
        if (! $user->otp_code) {
            return response()->json(['message' => 'No reset code requested.'], 422);
        }
        if (! Hash::check($request->otp, $user->otp_code)) {
            Log::warning('Invalid reset OTP attempt', ['email' => $user->email, 'ip' => $request->ip()]);
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }
        if (now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        return response()->json(['message' => 'OTP verified. Proceed to reset password.']);
    }

    // ── Forgot Password: reset ────────────────────────────────────────────

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'otp'                   => 'required|digits:6',
            'password'              => 'required|min:8',
            'password_confirmation' => 'required|same:password',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || $user->isAdmin()) {
            return response()->json(['message' => 'Unable to process request.'], 422);
        }

        // Re-validate OTP
        if (! $user->otp_code || ! Hash::check($request->otp, $user->otp_code)) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }
        if (now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        // ③ Prevent password reuse
        if ($user->hasUsedPassword($request->password)) {
            return response()->json([
                'message' => 'New password cannot be the same as previous passwords.',
            ], 422);
        }

        // Save old password to history before overwriting
        $user->pushPasswordHistory();

        $user->update([
            'password'       => Hash::make($request->password),
            'otp_code'       => null,
            'otp_expires_at' => null,
        ]);

        // Clear any lockout after successful reset
        $user->resetLoginAttempts();

        Log::info('Password reset successful', ['email' => $user->email, 'ip' => $request->ip()]);

        return response()->json(['message' => 'Password reset successfully.']);
    }
}