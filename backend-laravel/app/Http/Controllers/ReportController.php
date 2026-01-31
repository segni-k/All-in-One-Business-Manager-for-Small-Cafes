<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ReportService;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService){
        $this->reportService = $reportService;
    }

    // GET /api/reports/daily?date=2026-01-31
    public function daily(Request $request){
        $report = $this->reportService->dailyProfitLoss($request->query('date'));
        return response()->json($report);
    }

    // GET /api/reports/monthly?month=1&year=2026
    public function monthly(Request $request){
        $report = $this->reportService->monthlyProfitLoss(
            $request->query('month'),
            $request->query('year')
        );
        return response()->json($report);
    }
}
