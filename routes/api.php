<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAuthController;

Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', function () {
        return response()->json(['message' => 'Welcome Admin']);
    });

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
});
