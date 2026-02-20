<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'CafeOps backend is running',
        'health' => url('/up'),
        'api' => url('/api'),
    ]);
});
