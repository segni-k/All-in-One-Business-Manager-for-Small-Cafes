<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'CafeOps backend is running',
        'health' => '/up',
        'api' => '/api',
    ]);
});

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:api')
    ->withoutMiddleware([ValidateCsrfToken::class]);
