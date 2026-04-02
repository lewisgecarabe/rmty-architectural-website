<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AboutSectionController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\GoogleOAuthController;
use App\Http\Controllers\Api\FacebookOAuthController;
use App\Http\Controllers\Api\ViberSettingsController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Webhooks\GmailWebhookController;
use App\Http\Controllers\Webhooks\MetaWebhookController;
use App\Http\Controllers\Webhooks\ViberWebhookController;

Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', function () {
        return response()->json(['message' => 'Welcome Admin']);
    });

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/admin/me', [AdminManagementController::class, 'getCurrentAdmin']);
    Route::post('/admin/profile', [AdminAuthController::class, 'updateProfile']);
    Route::get('/admin/profile/activities', [AdminManagementController::class, 'getProfileActivities']);
});

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/about', [AboutSectionController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/projects', [ProjectController::class, 'adminIndex']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::post('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::delete('/projects/{id}/gallery/{imageId}', [ProjectController::class, 'deleteGalleryImage']);

    Route::get('/admin/services', [ServiceController::class, 'adminIndex']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::post('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    Route::get('/admin/about', [AboutSectionController::class, 'adminIndex']);
    Route::post('/about', [AboutSectionController::class, 'store']);
    Route::put('/about/{id}', [AboutSectionController::class, 'update']);
    Route::post('/about/{id}', [AboutSectionController::class, 'update']);
    Route::delete('/about/{id}', [AboutSectionController::class, 'destroy']);
});

// Consultation booking — public (contact form)
Route::post('/consultations', [ConsultationController::class, 'store']);

 Route::post('password/send-otp', [PasswordResetController::class, 'sendOtp']);
 Route::post('password/verify-otp', [PasswordResetController::class, 'verifyOtp']);
Route::post('password/reset', [PasswordResetController::class, 'resetPassword']);
// Admin CRUD operations (require login)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admins', [AdminManagementController::class, 'index']);
    Route::get('/admins/{id}', [AdminManagementController::class, 'show']);
    Route::post('/admins', [AdminManagementController::class, 'store']);
    Route::put('/admins/{id}', [AdminManagementController::class, 'update']);
    Route::patch('/admins/{id}', [AdminManagementController::class, 'update']);
    Route::delete('/admins/{id}', [AdminManagementController::class, 'destroy']);
    Route::get('/admins/{id}/can-delete', [AdminManagementController::class, 'canDelete']);
    Route::post('/admins/{id}/archive', [AdminManagementController::class, 'archive']);
    Route::post('/admins/{id}/restore', [AdminManagementController::class, 'restore']);
    // Dashboard stats

    Route::get('/inquiries/stats', [InquiryController::class, 'stats']);
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::post('/inquiries', [InquiryController::class, 'store']);
    Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show']);
    Route::put('/inquiries/{inquiry}', [InquiryController::class, 'update']);
    Route::delete('/inquiries/{inquiry}', [InquiryController::class, 'destroy']);
   Route::post('/inquiries/{inquiry}/reply', [InquiryController::class, 'reply']);

    // Consultations (admin management)
    Route::get('/admin/consultations', [ConsultationController::class, 'index']);
    Route::put('/consultations/{id}', [ConsultationController::class, 'update']);
    Route::post('/consultations/{id}', [ConsultationController::class, 'update']);
    Route::delete('/consultations/{id}', [ConsultationController::class, 'destroy']);
});


// ── OAuth Callbacks (public — no auth, Google/Facebook redirect here) ──
Route::get('/admin/google/callback',   [GoogleOAuthController::class,   'handleCallback']);
Route::get('/admin/facebook/callback', [FacebookOAuthController::class, 'handleCallback']);

// ── Platform Settings (protected) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/google/auth-url',        [GoogleOAuthController::class,   'getAuthUrl']);
    Route::get('/admin/google/status',          [GoogleOAuthController::class,   'status']);
    Route::delete('/admin/google/disconnect',   [GoogleOAuthController::class,   'disconnect']);

    Route::get('/admin/facebook/auth-url',      [FacebookOAuthController::class, 'getAuthUrl']);
    Route::get('/admin/facebook/status',        [FacebookOAuthController::class, 'status']);
    Route::delete('/admin/facebook/disconnect', [FacebookOAuthController::class, 'disconnect']);

    Route::get('/admin/viber/status',           [ViberSettingsController::class, 'status']);
    Route::post('/admin/viber/connect',         [ViberSettingsController::class, 'connect']);
    Route::delete('/admin/viber/disconnect',    [ViberSettingsController::class, 'disconnect']);
});

// ── Webhook Routes (public — verified by platform signatures) ──
Route::prefix('webhooks')->middleware('throttle:120,1')->group(function () {
    Route::post('/gmail',  [GmailWebhookController::class, 'handle']);
    Route::get('/meta',    [MetaWebhookController::class,  'verify']);
    Route::post('/meta',   [MetaWebhookController::class,  'handle']);
    Route::post('/viber',  [ViberWebhookController::class, 'handle']);
});