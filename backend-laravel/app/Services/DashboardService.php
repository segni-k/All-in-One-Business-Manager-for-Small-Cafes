<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;

class DashboardService
{
    protected ReportService $reportService;
    protected int $lowStockThreshold = 5;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get dashboard data for POS staff.
     */
    public function getDashboardData(): array
    {
        $today = Carbon::today()->toDateString();

        $todayOrders = Order::with('items.product')
            ->whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->get();

        $pendingOrders = Order::with('items.product', 'user')
            ->where('status', 'pending')
            ->latest()
            ->get();

        $lowStockProducts = Product::where('stock', '<=', $this->lowStockThreshold)->get();

        $dailyProfitLoss = $this->reportService->dailyProfitLoss($today);
        $monthlyProfitLoss = $this->reportService->monthlyProfitLoss();
        $yearlyProfitLoss = $this->reportService->yearlyTrend(1)[0] ?? [
            'total_sales' => 0,
            'total_cost' => 0,
            'profit' => 0,
            'order_count' => 0,
        ];
        $dailyTrends = $this->reportService->dailyTrend(14);

        $recentOrders = Order::with('items.product', 'user')
            ->latest()
            ->take(5)
            ->get();

        return [
            'todays_sales' => (float) $todayOrders->sum('grand_total'),
            'today_orders_count' => (int) $todayOrders->count(),
            'pending_orders' => (int) $pendingOrders->count(),
            'pending_orders_count' => (int) $pendingOrders->count(),
            'pending_orders_list' => $pendingOrders,
            'low_stock_products' => $lowStockProducts,
            'daily_profit_loss' => $dailyProfitLoss,
            'monthly_profit_loss' => $monthlyProfitLoss,
            'yearly_profit_loss' => $yearlyProfitLoss,
            'sales_profit_trends' => $dailyTrends,
            'daily_trends' => $dailyTrends,
            'recent_orders' => $recentOrders,
        ];
    }
}
