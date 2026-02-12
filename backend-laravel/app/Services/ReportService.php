<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Calculate daily profit/loss for a given date.
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
     * Daily trend for the last N days.
     */
    public function dailyTrend(int $days = 30): array
    {
        $days = max(1, min($days, 365));
        $start = Carbon::today()->subDays($days - 1)->startOfDay();

        $rows = Order::query()
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COALESCE(SUM(grand_total), 0) as total_sales')
            ->selectRaw('COUNT(*) as order_count')
            ->where('status', '!=', 'cancelled')
            ->whereDate('created_at', '>=', $start->toDateString())
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $daily = $this->dailyProfitLoss($date);
            $row = $rows->get($date);

            $result[] = [
                'date' => $date,
                'total_sales' => (float) ($row->total_sales ?? 0),
                'total_cost' => (float) ($daily['total_cost'] ?? 0),
                'profit' => (float) ($daily['profit'] ?? 0),
                'order_count' => (int) ($row->order_count ?? 0),
            ];
        }

        return $result;
    }

    /**
     * Calculate monthly profit/loss for a given month/year.
     */
    public function monthlyProfitLoss(?int $month = null, ?int $year = null): array
    {
        $month = $month ?: Carbon::now()->month;
        $year = $year ?: Carbon::now()->year;

        $orders = Order::with('items.product')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where('status', '!=', 'cancelled')
            ->get();

        return $this->calculateProfit($orders, ['month' => $month, 'year' => $year]);
    }

    /**
     * Monthly trend for all months in a year.
     */
    public function monthlyTrend(?int $year = null): array
    {
        $year = $year ?: Carbon::now()->year;
        $result = [];

        for ($month = 1; $month <= 12; $month++) {
            $report = $this->monthlyProfitLoss($month, $year);
            $result[] = [
                'month' => Carbon::create($year, $month, 1)->format('M'),
                'year' => $year,
                'month_number' => $month,
                'total_sales' => (float) $report['total_sales'],
                'total_cost' => (float) $report['total_cost'],
                'profit' => (float) $report['profit'],
                'order_count' => (int) $report['order_count'],
            ];
        }

        return $result;
    }

    /**
     * Yearly trend for the past N years.
     */
    public function yearlyTrend(int $years = 5): array
    {
        $years = max(1, min($years, 25));
        $currentYear = Carbon::now()->year;
        $startYear = $currentYear - ($years - 1);
        $result = [];

        for ($year = $startYear; $year <= $currentYear; $year++) {
            $orders = Order::with('items.product')
                ->whereYear('created_at', $year)
                ->where('status', '!=', 'cancelled')
                ->get();

            $summary = $this->calculateProfit($orders, ['year' => $year]);
            $result[] = [
                'year' => $year,
                'total_sales' => (float) $summary['total_sales'],
                'total_cost' => (float) $summary['total_cost'],
                'profit' => (float) $summary['profit'],
                'order_count' => (int) $summary['order_count'],
            ];
        }

        return $result;
    }

    /**
     * Overall (all-time) summary.
     */
    public function overallSummary(): array
    {
        $orders = Order::with('items.product')
            ->where('status', '!=', 'cancelled')
            ->get();

        return $this->calculateProfit($orders, ['scope' => 'overall']);
    }

    /**
     * Internal helper to calculate profit/loss.
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
            'total_sales' => (float) $totalSales,
            'total_cost' => (float) $totalCost,
            'profit' => (float) ($totalSales - $totalCost),
            'order_count' => (int) $orders->count(),
        ]);
    }
}
