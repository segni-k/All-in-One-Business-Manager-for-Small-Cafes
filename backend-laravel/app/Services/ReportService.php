<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * Calculate daily profit/loss for a given date.
     *
     * @param string|null $date
     * @return array
     */
    public function dailyProfitLoss(?string $date = null): array
    {
        $date = $date ? Carbon::parse($date)->toDateString() : Carbon::today()->toDateString();

        $orders = Order::with('items.product')
            ->whereDate('created_at', $date)
            ->where('status', '!=', 'cancelled')
            ->get();

        return $this->calculateProfit($orders, ['date' => $date]);
    }

    /**
     * Calculate monthly profit/loss for a given month/year.
     *
     * @param int|null $month
     * @param int|null $year
     * @return array
     */
    public function monthlyProfitLoss(?int $month = null, ?int $year = null): array
    {
        $month = $month ?? Carbon::now()->month;
        $year = $year ?? Carbon::now()->year;

        $orders = Order::with('items.product')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where('status', '!=', 'cancelled')
            ->get();

        return $this->calculateProfit($orders, ['month' => $month, 'year' => $year]);
    }

    /**
     * Internal helper to calculate profit/loss
     *
     * @param Collection $orders
     * @param array $extra
     * @return array
     */
    protected function calculateProfit(Collection $orders, array $extra = []): array
    {
        $totalSales = 0;
        $totalCost = 0;

        foreach ($orders as $order) {
            $totalSales += $order->grand_total;

            foreach ($order->items as $item) {
                $cost = $item->product->cost ?? 0;
                $totalCost += $cost * $item->quantity;
            }
        }

        return array_merge($extra, [
            'total_sales' => $totalSales,
            'total_cost' => $totalCost,
            'profit' => $totalSales - $totalCost,
            'orders_count' => $orders->count(),
        ]);
    }
}
