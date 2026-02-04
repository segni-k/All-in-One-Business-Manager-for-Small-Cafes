<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
        // Permission middleware applied in routes
    }

    /**
     * GET /api/dashboard
     */
    public function index(): JsonResponse
    {
        $data = $this->dashboardService->getDashboardData();
        return response()->json($data, 200);
    }
}


