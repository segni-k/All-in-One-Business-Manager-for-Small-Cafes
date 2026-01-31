<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Staff\StaffController;
use App\Http\Controllers\POS\OrderController;
use App\Http\Controllers\ReportController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin-only staff management
    Route::middleware('role:Admin')->group(function () {
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{id}', [StaffController::class, 'update']);
        Route::delete('/staff/{id}', [StaffController::class, 'destroy']);
    });

    // Admin & Cashier orders
    Route::middleware('role:Admin,Cashier')->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::put('/orders/{id}', [OrderController::class, 'update']);
        Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    });
    Route::middleware('role:Admin,Manager')->group(function () {
        Route::get('/reports/daily', [ReportController::class, 'daily']);
        Route::get('/reports/monthly', [ReportController::class, 'monthly']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });
});
