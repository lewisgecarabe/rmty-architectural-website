<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;                          // ← was missing; caused 500 on promote
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^[^@]*[A-Za-z][^@]*@.+\..+$/',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ], [
            'email.regex'  => 'Email must contain letters and a valid domain.',
            'password'     => 'Password must be at least 8 chars with upper, lower, number, and symbol.',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();

        // ── Role check ──────────────────────────────────────────────────────
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            Auth::logout();
            return response()->json(['message' => 'Unauthorized'], 403);
        }                                     // ← brace was missing before; broke everything below

        // ── Archived check ──────────────────────────────────────────────────
        if ($user->archived_at) {
            Auth::logout();
            return response()->json([
                'message' => 'This account has been archived and cannot sign in.',
            ], 403);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,         // ← frontend already reads this
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'data' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'first_name'        => $user->first_name,
                'last_name'         => $user->last_name,
                'email'             => $user->email,
                'role'              => $user->role,
                'profile_photo_url' => $user->profile_photo_url,
            ],
        ]);
    }

    /**
     * Promote an admin to super_admin.
     * Only a super_admin may call this. Self-promotion is blocked.
     */
   

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'first_name'    => 'sometimes|string|max:100',
            'last_name'     => 'sometimes|string|max:100',
            'email'         => 'sometimes|email|unique:users,email,' . $user->id,
            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            $data['profile_photo'] = $request->file('profile_photo')
                ->store('avatars', 'public');
        }

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $first        = $data['first_name'] ?? $user->first_name;
            $last         = $data['last_name']  ?? $user->last_name;
            $data['name'] = trim("{$first} {$last}");
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'data'    => [
                'id'                => $user->id,
                'name'              => $user->name,
                'first_name'        => $user->first_name,
                'last_name'         => $user->last_name,
                'email'             => $user->email,
                'role'              => $user->role,
                'profile_photo_url' => $user->profile_photo_url,
            ],
        ]);
    }
}