<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AboutSectionController;
use App\Http\Controllers\Api\PasswordResetController;


Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', function () {
        return response()->json(['message' => 'Welcome Admin']);
    });

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
});

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/admin/projects', [ProjectController::class, 'adminIndex']);
Route::post('/projects', [ProjectController::class, 'store']);
Route::put('/projects/{id}', [ProjectController::class, 'update']);
Route::post('/projects/{id}', [ProjectController::class, 'update']);
Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/admin/services', [ServiceController::class, 'adminIndex']);
Route::post('/services', [ServiceController::class, 'store']);
Route::put('/services/{id}', [ServiceController::class, 'update']);
Route::post('/services/{id}', [ServiceController::class, 'update']);
Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

Route::get('/about', [AboutSectionController::class, 'index']);
Route::get('/admin/about', [AboutSectionController::class, 'adminIndex']);
Route::post('/about', [AboutSectionController::class, 'store']);
Route::put('/about/{id}', [AboutSectionController::class, 'update']);
Route::post('/about/{id}', [AboutSectionController::class, 'update']);
Route::delete('/about/{id}', [AboutSectionController::class, 'destroy']);

 Route::post('/password/send-otp', [PasswordResetController::class, 'sendOtp']);
 Route::post('/password/verify-otp', [PasswordResetController::class, 'verifyOtp']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);