<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
        // Permission middleware applied in routes
    }

    /**
     * GET /api/reports/daily?date=YYYY-MM-DD
     */
    public function daily(Request $request): JsonResponse
    {
        $report = $this->reportService->dailyProfitLoss($request->query('date'));
        return response()->json($report, 200);
    }

    /**
     * GET /api/reports/monthly?month=1&year=2026
     */
    public function monthly(Request $request): JsonResponse
    {
        $report = $this->reportService->monthlyProfitLoss(
            (int) $request->query('month'),
            (int) $request->query('year')
        );

        return response()->json($report, 200);
    }
}

