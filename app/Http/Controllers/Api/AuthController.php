<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller; // ✅ ADD THIS

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClientOtpMail;


class AuthController extends Controller
{
    // app/Http/Controllers/AuthController.php



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
        // ✅ IF ALREADY VERIFIED → block
        if ($user->email_verified_at) {
            return response()->json([
                'error' => 'Email already registered'
            ], 422);
        }

        // ✅ IF NOT VERIFIED → UPDATE OTP
        $user->update([
    'first_name'     => $request->first_name,  // ✅ ADD
    'last_name'      => $request->last_name,   // ✅ ADD
    'otp_code'       => Hash::make($otp),
    'otp_expires_at' => now()->addMinutes(5),
]);
    
    } else {
        // ✅ CREATE NEW USER
       $user = User::create([
    'name'           => $request->first_name . ' ' . $request->last_name,
    'first_name'     => $request->first_name,  // ✅ ADD
    'last_name'      => $request->last_name,   // ✅ ADD
    'email'          => $request->email,
    'password'       => Hash::make($request->password),
    'otp_code'       => Hash::make($otp),
    'otp_expires_at' => now()->addMinutes(5),
]);
    }

    // SEND OTP
   Mail::to($user->email)->send(new ClientOtpMail((string) $otp, $user->first_name ?? $user->name));


    return response()->json([
        'message' => 'OTP sent',
        'email' => $user->email
    ]);
}
public function verifyOtp(Request $request)
{
    $user = User::where('email', $request->email)->first();

   if (!$user) {
    return response()->json(['message' => 'User not found'], 404);
}

if (!$user->otp_code) {
    return response()->json(['message' => 'No OTP requested'], 422);
}

if (!Hash::check($request->otp, $user->otp_code)) {
    return response()->json(['message' => 'Invalid OTP'], 422);
}

if (now()->gt($user->otp_expires_at)) {
    return response()->json(['message' => 'OTP expired'], 422);
}
    $user->email_verified_at = now();
    $user->otp_code = null;
    $user->save();

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user
    ]);
}
    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}