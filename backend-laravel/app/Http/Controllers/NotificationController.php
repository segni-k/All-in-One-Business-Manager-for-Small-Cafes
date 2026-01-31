<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(NotificationService $service)
    {
        return response()->json(\App\Models\Notification::latest()->take(50)->get());
    }
    //
}
