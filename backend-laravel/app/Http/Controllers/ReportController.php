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
        $date = $request->query('date');
        $report = $date
            ? $this->reportService->dailyProfitLoss($date)
            : $this->reportService->dailyTrend((int) $request->query('days', 30));
        return response()->json($report, 200);
    }

    /**
     * GET /api/reports/monthly?month=1&year=2026
     */
    public function monthly(Request $request): JsonResponse
    {
        $year = $request->query('year');
        $month = $request->query('month');
        $report = $month
            ? $this->reportService->monthlyProfitLoss((int) $month, $year ? (int) $year : null)
            : $this->reportService->monthlyTrend($year ? (int) $year : null);

        return response()->json($report, 200);
    }

    /**
     * GET /api/reports/yearly?years=5
     */
    public function yearly(Request $request): JsonResponse
    {
        $years = (int) $request->query('years', 5);
        $report = $this->reportService->yearlyTrend($years);
        return response()->json($report, 200);
    }

    /**
     * GET /api/reports/overall
     */
    public function overall(): JsonResponse
    {
        $report = $this->reportService->overallSummary();
        return response()->json($report, 200);
    }
}
