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

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/about', [AboutSectionController::class, 'index']);

Route::post('/password/send-otp', [PasswordResetController::class, 'sendOtp']);
Route::post('/password/verify-otp', [PasswordResetController::class, 'verifyOtp']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);

Route::post('/consultations', [ConsultationController::class, 'store']);

/*
|--------------------------------------------------------------------------
| OAuth Callback Routes
|--------------------------------------------------------------------------
*/

Route::get('/admin/google/callback', [GoogleOAuthController::class, 'handleCallback']);
Route::get('/admin/facebook/callback', [FacebookOAuthController::class, 'handleCallback']);

/*
|--------------------------------------------------------------------------
| Webhook Routes
|--------------------------------------------------------------------------
*/

Route::prefix('webhooks')->middleware('throttle:120,1')->group(function () {
    Route::post('/gmail', [GmailWebhookController::class, 'handle']);
    Route::get('/meta', [MetaWebhookController::class, 'verify']);
    Route::post('/meta', [MetaWebhookController::class, 'handle']);
    Route::post('/viber', [ViberWebhookController::class, 'handle']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Admin auth
    Route::get('/admin/dashboard', fn() => response()->json(['message' => 'Welcome Admin']));
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/admin/me', [AdminManagementController::class, 'getCurrentAdmin']);
    Route::post('/admin/profile', [AdminAuthController::class, 'updateProfile']);
    Route::get('/admin/profile/activities', [AdminManagementController::class, 'getProfileActivities']);

    // Projects
    Route::get('/admin/projects', [ProjectController::class, 'adminIndex']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::post('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::delete('/projects/{id}/gallery/{imageId}', [ProjectController::class, 'deleteGalleryImage']);

    // Services
    Route::get('/admin/services', [ServiceController::class, 'adminIndex']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::post('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    // About
    Route::get('/admin/about', [AboutSectionController::class, 'adminIndex']);
    Route::post('/about', [AboutSectionController::class, 'store']);
    Route::put('/about/{id}', [AboutSectionController::class, 'update']);
    Route::post('/about/{id}', [AboutSectionController::class, 'update']);
    Route::delete('/about/{id}', [AboutSectionController::class, 'destroy']);

    // Admin management
    Route::get('/admins', [AdminManagementController::class, 'index']);
    Route::get('/admins/{id}', [AdminManagementController::class, 'show']);
    Route::post('/admins', [AdminManagementController::class, 'store']);
    Route::put('/admins/{id}', [AdminManagementController::class, 'update']);
    Route::patch('/admins/{id}', [AdminManagementController::class, 'update']);
    Route::delete('/admins/{id}', [AdminManagementController::class, 'destroy']);
    Route::get('/admins/{id}/can-delete', [AdminManagementController::class, 'canDelete']);
    Route::post('/admins/{id}/archive', [AdminManagementController::class, 'archive']);
    Route::post('/admins/{id}/restore', [AdminManagementController::class, 'restore']);

    // Inquiries
    Route::get('/inquiries/stats', [InquiryController::class, 'stats']);
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::post('/inquiries', [InquiryController::class, 'store']);
    Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show']);
    Route::put('/inquiries/{inquiry}', [InquiryController::class, 'update']);
    Route::delete('/inquiries/{inquiry}', [InquiryController::class, 'destroy']);
    Route::post('/inquiries/{inquiry}/reply', [InquiryController::class, 'reply']);

    // Consultations
    Route::get('/consultations', [ConsultationController::class, 'index']);
    Route::get('/consultations/{consultation}', [ConsultationController::class, 'show']);
    Route::patch('/consultations/{consultation}/status', [ConsultationController::class, 'updateStatus']);
    Route::patch('/consultations/{consultation}/viewed', [ConsultationController::class, 'markViewed']);

    // Platform settings — Google
    Route::get('/admin/google/auth-url', [GoogleOAuthController::class, 'getAuthUrl']);
    Route::get('/admin/google/status', [GoogleOAuthController::class, 'status']);
    Route::delete('/admin/google/disconnect', [GoogleOAuthController::class, 'disconnect']);

    // Platform settings — Facebook
    Route::get('/admin/facebook/auth-url', [FacebookOAuthController::class, 'getAuthUrl']);
    Route::get('/admin/facebook/status', [FacebookOAuthController::class, 'status']);
    Route::delete('/admin/facebook/disconnect', [FacebookOAuthController::class, 'disconnect']);

    // Platform settings — Viber
    Route::get('/admin/viber/status', [ViberSettingsController::class, 'status']);
    Route::post('/admin/viber/connect', [ViberSettingsController::class, 'connect']);
    Route::delete('/admin/viber/disconnect', [ViberSettingsController::class, 'disconnect']);
});