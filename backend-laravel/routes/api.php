<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Staff\StaffController;
use App\Http\Controllers\POS\OrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\POS\ProductController;

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
    // Products (POS + Inventory)
    // -----------------------------

    // POS access (cashier, manager, admin) - read-only
    Route::middleware('permission:use_pos')->prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/{product}', [ProductController::class, 'show']);
    });

    // Inventory management (manager, admin) - write access
    Route::middleware('permission:manage_inventory')->prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
        Route::post('/{id}/restore', [ProductController::class, 'restore']);
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
    // Reports (admin + manager)
    // -----------------------------
    Route::middleware('permission:view_reports')->group(function () {
        Route::get('/reports/daily', [ReportController::class, 'daily']);
        Route::get('/reports/monthly', [ReportController::class, 'monthly']);
    });

    // -----------------------------
    // Dashboard & notifications (use existing POS permission)
    // -----------------------------
    Route::middleware('permission:use_pos')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
    });

});

