<?php


use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\StaffController;

Route::post('/register',[AuthController::class,'register']);
Route::post('/login',[AuthController::class,'login']);

Route::middleware('auth:sanctum')->group(function(){
    Route::post('/logout',[AuthController::class,'logout']);
    Route::get('/me',[AuthController::class,'me']);

    // Admin-only staff management
    Route::middleware('role:Admin')->group(function(){
        Route::get('/staff',[StaffController::class,'index']);
        Route::post('/staff',[StaffController::class,'store']);
        Route::put('/staff/{id}',[StaffController::class,'update']);
        Route::delete('/staff/{id}',[StaffController::class,'destroy']);
    });
});

