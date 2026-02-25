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

        $todaySummary = Order::query()
            ->whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('COALESCE(SUM(grand_total), 0) as total_sales')
            ->selectRaw('COUNT(*) as order_count')
            ->first();

        $pendingOrdersCount = Order::query()
            ->where('status', 'pending')
            ->count();

        $pendingOrdersList = Order::query()
            ->with([
                'items.product:id,name,sku,image_url,price,cost,stock,category_id,is_active,deleted_at,created_at,updated_at',
                'user:id,name,email,avatar_url,role_id,is_active,created_at,updated_at',
            ])
            ->where('status', 'pending')
            ->latest()
            ->take(25)
            ->get();

        $lowStockProducts = Product::query()
            ->where('stock', '<=', $this->lowStockThreshold)
            ->orderBy('stock')
            ->get();

        $dailyProfitLoss = $this->reportService->dailyProfitLoss($today);
        $monthlyProfitLoss = $this->reportService->monthlyProfitLoss();
        $yearlyProfitLoss = $this->reportService->yearlyTrend(1)[0] ?? [
            'total_sales' => 0,
            'total_cost' => 0,
            'profit' => 0,
            'order_count' => 0,
        ];
        $dailyTrends = $this->reportService->dailyTrend(14);

        $recentOrders = Order::query()
            ->with([
                'items.product:id,name,sku,image_url,price,cost,stock,category_id,is_active,deleted_at,created_at,updated_at',
                'user:id,name,email,avatar_url,role_id,is_active,created_at,updated_at',
            ])
            ->latest()
            ->take(5)
            ->get();

        return [
            'todays_sales' => (float) ($todaySummary?->total_sales ?? 0),
            'today_orders_count' => (int) ($todaySummary?->order_count ?? 0),
            'pending_orders' => (int) $pendingOrdersCount,
            'pending_orders_count' => (int) $pendingOrdersCount,
            'pending_orders_list' => $pendingOrdersList,
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
