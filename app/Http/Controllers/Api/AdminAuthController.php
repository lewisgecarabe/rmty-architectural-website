<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    /**
     * ADMIN LOGIN (NO REGISTER)
     */
    public function login(Request $request)
    {
        // 1️⃣ Validate input
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2️⃣ Attempt login using email + password
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // 3️⃣ Get authenticated user
        $user = Auth::user();

        // 4️⃣ Ensure user is ADMIN
        if (!$user->is_admin) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // 5️⃣ Create Sanctum token
        $token = $user->createToken('admin-token')->plainTextToken;

    
        // 6️⃣ Return token + user
        return response()->json([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user->id,  // ← Make sure to include this
            'name' => $user->name,
            'email' => $user->email,
        ]
    ]);
}
    

    /**
     * ADMIN LOGOUT
     */
    public function logout(Request $request)
    {
        // Delete all tokens for this admin
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out'
        ]);
    }
}
