<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Staff\StaffController;
use App\Http\Controllers\POS\OrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CustomerController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // -----------------------------
    // Staff management (admin-only)
    // -----------------------------
    Route::middleware('permission:manage_staff')->group(function () {
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{user}', [StaffController::class, 'update']);
        Route::delete('/staff/{user}', [StaffController::class, 'destroy']);
    });

    // -----------------------------
    // POS Orders (staff with POS permission)
    // -----------------------------
    Route::middleware('permission:use_pos')->prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::post('/', [OrderController::class, 'store']);
        Route::put('/{id}', [OrderController::class, 'update']);
        Route::post('/{id}/cancel', [OrderController::class, 'cancel']);
    });

    // -----------------------------
    // Reports & dashboard (permission-based)
    // -----------------------------
    Route::middleware('permission:view_reports')->group(function () {
        Route::get('/reports/daily', [ReportController::class, 'daily']);
        Route::get('/reports/monthly', [ReportController::class, 'monthly']);
    });

    Route::middleware('permission:view_dashboard')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });

    Route::middleware('permission:view_notifications')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
    });

    // -----------------------------
    // Customer management (permission-based)
    // -----------------------------
    Route::middleware('permission:manage_customers')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        Route::get('/customers/{customer}/orders', [CustomerController::class, 'orders']);
    });
});

