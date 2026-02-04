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
     * Get dashboard data for POS staff
     *
     * @return array
     */
    public function getDashboardData(): array
    {
        $today = Carbon::today()->toDateString();

        // 1️⃣ Today’s Orders
        $todayOrders = Order::with('items.product')
            ->whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->get();

        $totalSales = $todayOrders->sum('grand_total');
        $ordersCount = $todayOrders->count();

        // 2️⃣ Pending Orders
        $pendingOrders = Order::with('items.product')
            ->where('status', 'pending')
            ->latest()
            ->get();

        $pendingCount = $pendingOrders->count();

        // 3️⃣ Low Stock Products
        $lowStockProducts = Product::where('stock', '<=', $this->lowStockThreshold)->get();

        // 4️⃣ Daily Profit/Loss
        $profitLoss = $this->reportService->dailyProfitLoss($today);

        // 5️⃣ Recent Orders
        $recentOrders = Order::with('items.product')
            ->latest()
            ->take(5)
            ->get();

        return [
            'today_sales' => $totalSales,
            'today_orders_count' => $ordersCount,
            'pending_orders_count' => $pendingCount,
            'pending_orders' => $pendingOrders,
            'low_stock_products' => $lowStockProducts,
            'daily_profit_loss' => $profitLoss,
            'recent_orders' => $recentOrders,
        ];
    }
}
