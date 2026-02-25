<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Database\QueryException;
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
        try {
            $data = $this->dashboardService->getDashboardData();
            return response()->json($data, 200);
        } catch (QueryException $exception) {
            report($exception);
            return response()->json([
                'message' => 'Dashboard data is temporarily unavailable due to a database issue.',
            ], 503);
        }
    }
}

