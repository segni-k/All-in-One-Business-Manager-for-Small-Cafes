<?php

use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Staff\StaffController;
use App\Http\Controllers\POS\OrderController;
use App\Http\Controllers\ReportController;


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin-only staff management
    Route::middleware('permission:manage_staff')->group(function () {
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{user}', [StaffController::class, 'update']);
        Route::delete('/staff/{user}', [StaffController::class, 'destroy']);
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
        Route::get('/notifications', [NotificationController::class, 'index']);
    });

    Route::middleware('role:Admin,Manager,Cashier')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        Route::get('/customers/{customer}/orders', [CustomerController::class, 'orders']);
    });
});
