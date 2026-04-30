<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Mail\AdminOtpMail;
use Illuminate\Support\Facades\Mail;

class AdminManagementController extends Controller
{
    /**
     * Get all admin accounts (active or archived via ?archived=1)
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = User::whereIn('role', ['admin', 'super_admin'])

                ->select('id', 'name', 'first_name', 'last_name', 'email', 'role', 'archived_at', 'created_at', 'updated_at');

            if ($request->boolean('archived')) {
                $query->whereNotNull('archived_at');
            } else {
                $query->whereNull('archived_at');
            }

            $admins = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $admins,
                'total' => $admins->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch admin accounts: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch admin accounts'
            ], 500);
        }
    }

    /**
     * Get a single admin account
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $admin = User::whereIn('role', ['admin', 'super_admin'])

                ->select('id', 'name', 'first_name', 'last_name', 'email', 'role','archived_at', 'created_at', 'updated_at')
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $admin
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin account not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch admin account: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch admin account'
            ], 500);
        }
    }

    /**
     * Create a new admin account
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'first_name' => 'required|string|max:255',
        'last_name'  => 'required|string|max:255',
        'email'      => 'required|email|unique:users,email|max:255',
        'password'   => 'required|string|min:8|confirmed',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors'  => $validator->errors(),
        ], 422);
    }

    try {
        $otp  = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $name = trim($request->first_name . ' ' . $request->last_name);

        $admin = User::create([
            'name'           => $name,
            'first_name'     => $request->first_name,
            'last_name'      => $request->last_name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'is_admin'       => true,
            'role'           => 'admin',
            'otp'            => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes(5),
            'archived_at'    => now(), // locked until verified
        ]);

        Mail::to($admin->email)->send(new AdminOtpMail($otp, $admin->first_name));

        return response()->json([
            'success'  => true,
            'message'  => 'Admin created. OTP sent to their email for verification.',
            'admin_id' => $admin->id,
        ], 201);
    } catch (\Exception $e) {
        \Log::error('Failed to create admin: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to create admin account',
        ], 500);
    }
}

// ── verifyOtp() ──────────────────────────────────────────────────────
public function verifyOtp(Request $request, $id)
{
    $validator = Validator::make($request->all(), [
        'otp' => 'required|string|size:6',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'OTP is required (6 digits)',
        ], 422);
    }

    try {
        $admin = User::findOrFail($id);

        if (!$admin->otp_expires_at || now()->isAfter($admin->otp_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired. Please request a new one.',
            ], 422);
        }

        if (!Hash::check($request->otp, $admin->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP. Please try again.',
            ], 422);
        }

        // Activate the account
        $admin->otp            = null;
        $admin->otp_expires_at = null;
        $admin->archived_at    = null; // unlock
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Email verified. Admin account is now active.',
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json(['success' => false, 'message' => 'Admin not found'], 404);
    } catch (\Exception $e) {
        \Log::error('OTP verify error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Verification failed'], 500);
    }
}

// ── resendOtp() ──────────────────────────────────────────────────────
public function resendOtp(Request $request, $id)
{
    try {
        $admin = User::findOrFail($id);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $admin->otp            = Hash::make($otp);
        $admin->otp_expires_at = now()->addMinutes(5);
        $admin->save();

        Mail::to($admin->email)->send(new AdminOtpMail($otp, $admin->first_name));

        return response()->json(['success' => true, 'message' => 'OTP resent successfully.']);
    } catch (\Exception $e) {
        \Log::error('Resend OTP error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Failed to resend OTP'], 500);
    }
}
    /**
     * Update an existing admin account
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $admin = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => [
                    'sometimes',
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($id)
                ],
                'password' => 'sometimes|nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->has('first_name')) {
                $admin->first_name = $request->first_name;
            }
            if ($request->has('last_name')) {
                $admin->last_name = $request->last_name;
            }
            if ($request->has('first_name') || $request->has('last_name')) {
                $admin->name = trim(($admin->first_name ?? '') . ' ' . ($admin->last_name ?? ''));
            }

            if ($request->has('email')) {
                $admin->email = $request->email;
            }

            if ($request->filled('password')) {
                $admin->password = Hash::make($request->password);
                
                // Optionally revoke all tokens when password changes
                // Uncomment the line below if you want to force re-login after password change
                // $admin->tokens()->delete();
            }

            $admin->save();

            return response()->json([
                'success' => true,
                'message' => 'Admin account updated successfully',
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'first_name' => $admin->first_name,
                    'last_name' => $admin->last_name,
                    'email' => $admin->email,
                    'updated_at' => $admin->updated_at,
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin account not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Failed to update admin account: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update admin account'
            ], 500);
        }
    }

    /**
     * Delete an admin account
     * CRITICAL: Prevents self-deletion
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
{
    try {
        $authenticatedUser = $request->user();

        // If not authenticated
        if (!$authenticatedUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please log in again.'
            ], 401);
        }

        // Prevent self-deletion
        if ($authenticatedUser->id == (int) $id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        $admin = User::whereIn('role', ['admin', 'super_admin'])->findOrFail($id);

        // Only delete tokens if method exists (Sanctum safety)
        if (method_exists($admin, 'tokens')) {
            $admin->tokens()->delete();
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Admin account deleted successfully'
        ], 200);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Admin account not found'
        ], 404);

    } catch (\Exception $e) {
        \Log::error('Delete error: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => $e->getMessage() // show real error temporarily for debugging
        ], 500);
    }
}

    /**
     * Get current authenticated admin's information
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrentAdmin(Request $request)
{
    try {
        $currentAdmin = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id'                => $currentAdmin->id,
                'name'              => $currentAdmin->name,
                'first_name'        => $currentAdmin->first_name,
                'last_name'         => $currentAdmin->last_name,
                'email'             => $currentAdmin->email,
                'profile_photo_url' => $currentAdmin->profile_photo_url,
                'created_at'        => $currentAdmin->created_at,
                'updated_at'        => $currentAdmin->updated_at,
            ]
        ], 200);
    } catch (\Exception $e) {
        \Log::error('Failed to fetch current admin: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch current admin information'
        ], 500);
    }
}

    /**
     * Get current admin's content change history (for profile page)
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProfileActivities(Request $request)
    {
        try {
            $activities = AdminActivity::where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activities,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch profile activities: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity history',
            ], 500);
        }
    }

    /**
     * Archive an admin (e.g. resigned). They can no longer log in; can be restored later.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function archive(Request $request, $id)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in again.',
                ], 401);
            }

            if ($request->user()->id == (int) $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot archive your own account',
                ], 403);
            }

            $admin = User::whereIn('role', ['admin', 'super_admin'])
->findOrFail($id);
            $admin->archived_at = now();
            $admin->save();

            if (method_exists($admin, 'tokens')) {
                $admin->tokens()->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Admin account has been archived.',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin account not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Archive admin error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive account',
            ], 500);
        }
    }

    /**
     * Restore an archived admin so they can log in again.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore($id)
    {
        try {
            $admin = User::whereIn('role', ['admin', 'super_admin'])->findOrFail($id);
            $admin->archived_at = null;
            $admin->save();

            return response()->json([
                'success' => true,
                'message' => 'Admin account has been restored.',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin account not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Restore admin error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore account',
            ], 500);
        }
    }

    

    /**
     * Check if the authenticated admin can delete a specific account
     * Useful for frontend to disable delete button for own account
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
/**
 * Promote an admin to super_admin.
 * Only super_admin may call this. Self-promotion blocked.
 */
public function promote(Request $request, $id)
{
    $current = $request->user();

    if (!$current) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
    }

    if ($current->role !== 'super_admin') {
        return response()->json(['success' => false, 'message' => 'Only super admins can promote'], 403);
    }

    if ($current->id == (int) $id) {
        return response()->json(['success' => false, 'message' => 'You cannot promote yourself'], 403);
    }

    try {
        $user = User::whereIn('role', ['admin', 'super_admin'])->findOrFail($id);

        if ($user->role === 'super_admin') {
            return response()->json(['success' => false, 'message' => 'User is already a super_admin'], 422);
        }

        $user->role = 'super_admin';
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin promoted to super_admin',
            'data'    => ['id' => $user->id, 'role' => $user->role],
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json(['success' => false, 'message' => 'Admin not found'], 404);
    } catch (\Exception $e) {
        \Log::error('Promote error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Failed to promote admin'], 500);
    }
}

/**
 * Demote a super_admin back to admin.
 * Only super_admin may call this. Self-demotion blocked.
 */
public function demote(Request $request, $id)
{
    $current = $request->user();

    if (!$current) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
    }

    if ($current->role !== 'super_admin') {
        return response()->json(['success' => false, 'message' => 'Only super admins can demote'], 403);
    }

    if ($current->id == (int) $id) {
        return response()->json(['success' => false, 'message' => 'You cannot demote yourself'], 403);
    }

    try {
        $user = User::whereIn('role', ['admin', 'super_admin'])->findOrFail($id);

        if ($user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'User is not a super_admin'], 422);
        }

        $user->role = 'admin';
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'super_admin demoted to admin',
            'data'    => ['id' => $user->id, 'role' => $user->role],
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json(['success' => false, 'message' => 'Admin not found'], 404);
    } catch (\Exception $e) {
        \Log::error('Demote error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Failed to demote admin'], 500);
    }
}

    public function canDelete(Request $request, $id)
    {
        $authenticatedUserId = $request->user()->id;
        $canDelete = $authenticatedUserId != $id;

        return response()->json([
            'success' => true,
            'can_delete' => $canDelete,
            'reason' => $canDelete ? null : 'Cannot delete your own account'
        ], 200);
    }
}