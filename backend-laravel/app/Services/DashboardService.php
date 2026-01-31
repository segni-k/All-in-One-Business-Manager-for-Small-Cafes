<?php
namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;

class DashboardService
{
    protected $reportService;
    protected $lowStockThreshold = 5;

    public function __construct(ReportService $reportService){
        $this->reportService = $reportService;
    }

    public function getDashboardData()
    {
        $today = Carbon::today()->toDateString();

        // 1️⃣ Today’s Sales
        $todayOrders = Order::whereDate('created_at', $today)
            ->where('status','!=','cancelled')
            ->get();

        $totalSales = $todayOrders->sum('grand_total');
        $ordersCount = $todayOrders->count();

        // 2️⃣ Pending Orders
        $pendingOrders = Order::where('status','pending')
            ->with('items.product','customer','user')
            ->latest()
            ->get();

        $pendingCount = $pendingOrders->count();

        // 3️⃣ Low Stock Alerts
        $lowStockProducts = Product::where('stock','<=',$this->lowStockThreshold)
            ->get();

        // 4️⃣ Daily Profit/Loss
        $profitLoss = $this->reportService->dailyProfitLoss($today);

        // 5️⃣ Recent Orders (optional)
        $recentOrders = Order::with('items.product','customer','user')
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
            'recent_orders' => $recentOrders
        ];
    }
}
