<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    /**
     * Get all admin accounts
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $admins = User::select('id', 'name', 'email', 'created_at', 'updated_at')
                         ->orderBy('created_at', 'desc')
                         ->get();

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
            $admin = User::select('id', 'name', 'email', 'created_at', 'updated_at')
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
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $admin = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_admin' => true, // Explicitly set as admin
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Admin account created successfully',
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'created_at' => $admin->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to create admin account: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin account'
            ], 500);
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
                'name' => 'sometimes|required|string|max:255',
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

            // Update fields
            if ($request->has('name')) {
                $admin->name = $request->name;
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
        if ($authenticatedUser->id == $id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        $admin = User::findOrFail($id);

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
                    'id' => $currentAdmin->id,
                    'name' => $currentAdmin->name,
                    'email' => $currentAdmin->email,
                    'created_at' => $currentAdmin->created_at,
                    'updated_at' => $currentAdmin->updated_at,
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
     * Check if the authenticated admin can delete a specific account
     * Useful for frontend to disable delete button for own account
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
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