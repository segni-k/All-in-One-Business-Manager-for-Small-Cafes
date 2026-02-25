<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Calculate daily profit/loss for a given date.
     */
    public function dailyProfitLoss(?string $date = null): array
    {
        $date = $date
            ? Carbon::parse($date)->toDateString()
            : Carbon::today()->toDateString();

        $sales = $this->aggregateSalesAndOrders($date, $date);
        $totalCost = $this->aggregateCost($date, $date);

        return [
            'date' => $date,
            'total_sales' => $sales['total_sales'],
            'total_cost' => $totalCost,
            'profit' => $sales['total_sales'] - $totalCost,
            'order_count' => $sales['order_count'],
        ];
    }

    /**
     * Daily trend for the last N days.
     */
    public function dailyTrend(int $days = 30): array
    {
        $days = max(1, min($days, 365));
        $startDate = Carbon::today()->subDays($days - 1)->toDateString();
        $endDate = Carbon::today()->toDateString();

        $salesByDay = $this->groupedSalesByDay($startDate, $endDate);
        $costByDay = $this->groupedCostByDay($startDate, $endDate);

        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::parse($startDate)->addDays($i)->toDateString();
            $sales = $salesByDay[$date] ?? ['total_sales' => 0.0, 'order_count' => 0];
            $cost = $costByDay[$date] ?? 0.0;

            $result[] = [
                'date' => $date,
                'total_sales' => (float) $sales['total_sales'],
                'total_cost' => (float) $cost,
                'profit' => (float) $sales['total_sales'] - (float) $cost,
                'order_count' => (int) $sales['order_count'],
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

        $startDate = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $sales = $this->aggregateSalesAndOrders($startDate, $endDate);
        $totalCost = $this->aggregateCost($startDate, $endDate);

        return [
            'month' => $month,
            'year' => $year,
            'total_sales' => $sales['total_sales'],
            'total_cost' => $totalCost,
            'profit' => $sales['total_sales'] - $totalCost,
            'order_count' => $sales['order_count'],
        ];
    }

    /**
     * Monthly trend for all months in a year.
     */
    public function monthlyTrend(?int $year = null): array
    {
        $year = $year ?: Carbon::now()->year;
        $startDate = Carbon::create($year, 1, 1)->startOfDay()->toDateString();
        $endDate = Carbon::create($year, 12, 31)->endOfDay()->toDateString();

        $salesByDay = $this->groupedSalesByDay($startDate, $endDate);
        $costByDay = $this->groupedCostByDay($startDate, $endDate);

        $months = [];
        for ($month = 1; $month <= 12; $month++) {
            $months[$month] = [
                'month' => Carbon::create($year, $month, 1)->format('M'),
                'year' => $year,
                'month_number' => $month,
                'total_sales' => 0.0,
                'total_cost' => 0.0,
                'order_count' => 0,
            ];
        }

        foreach ($salesByDay as $day => $sales) {
            $month = (int) Carbon::parse($day)->format('n');
            $months[$month]['total_sales'] += (float) $sales['total_sales'];
            $months[$month]['order_count'] += (int) $sales['order_count'];
        }

        foreach ($costByDay as $day => $cost) {
            $month = (int) Carbon::parse($day)->format('n');
            $months[$month]['total_cost'] += (float) $cost;
        }

        return array_values(array_map(function (array $row) {
            return [
                'month' => $row['month'],
                'year' => $row['year'],
                'month_number' => $row['month_number'],
                'total_sales' => (float) $row['total_sales'],
                'total_cost' => (float) $row['total_cost'],
                'profit' => (float) $row['total_sales'] - (float) $row['total_cost'],
                'order_count' => (int) $row['order_count'],
            ];
        }, $months));
    }

    /**
     * Yearly trend for the past N years.
     */
    public function yearlyTrend(int $years = 5): array
    {
        $years = max(1, min($years, 25));
        $currentYear = Carbon::now()->year;
        $startYear = $currentYear - ($years - 1);

        $startDate = Carbon::create($startYear, 1, 1)->startOfDay()->toDateString();
        $endDate = Carbon::create($currentYear, 12, 31)->endOfDay()->toDateString();

        $salesByDay = $this->groupedSalesByDay($startDate, $endDate);
        $costByDay = $this->groupedCostByDay($startDate, $endDate);

        $yearBuckets = [];
        for ($year = $startYear; $year <= $currentYear; $year++) {
            $yearBuckets[$year] = [
                'year' => $year,
                'total_sales' => 0.0,
                'total_cost' => 0.0,
                'order_count' => 0,
            ];
        }

        foreach ($salesByDay as $day => $sales) {
            $year = (int) Carbon::parse($day)->format('Y');
            $yearBuckets[$year]['total_sales'] += (float) $sales['total_sales'];
            $yearBuckets[$year]['order_count'] += (int) $sales['order_count'];
        }

        foreach ($costByDay as $day => $cost) {
            $year = (int) Carbon::parse($day)->format('Y');
            $yearBuckets[$year]['total_cost'] += (float) $cost;
        }

        return array_values(array_map(function (array $row) {
            return [
                'year' => (int) $row['year'],
                'total_sales' => (float) $row['total_sales'],
                'total_cost' => (float) $row['total_cost'],
                'profit' => (float) $row['total_sales'] - (float) $row['total_cost'],
                'order_count' => (int) $row['order_count'],
            ];
        }, $yearBuckets));
    }

    /**
     * Overall (all-time) summary.
     */
    public function overallSummary(): array
    {
        $sales = $this->aggregateSalesAndOrders();
        $totalCost = $this->aggregateCost();

        return [
            'scope' => 'overall',
            'total_sales' => $sales['total_sales'],
            'total_cost' => $totalCost,
            'profit' => $sales['total_sales'] - $totalCost,
            'order_count' => $sales['order_count'],
        ];
    }

    private function aggregateSalesAndOrders(?string $startDate = null, ?string $endDate = null): array
    {
        $query = Order::query()
            ->where('status', '!=', 'cancelled');

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $summary = $query
            ->selectRaw('COALESCE(SUM(grand_total), 0) as total_sales')
            ->selectRaw('COUNT(*) as order_count')
            ->first();

        return [
            'total_sales' => (float) ($summary?->total_sales ?? 0),
            'order_count' => (int) ($summary?->order_count ?? 0),
        ];
    }

    private function aggregateCost(?string $startDate = null, ?string $endDate = null): float
    {
        $query = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->leftJoin('products as p', 'p.id', '=', 'oi.product_id')
            ->where('o.status', '!=', 'cancelled');

        if ($startDate) {
            $query->whereDate('o.created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('o.created_at', '<=', $endDate);
        }

        $totalCost = $query->selectRaw('COALESCE(SUM(oi.quantity * COALESCE(p.cost, 0)), 0) as total_cost')
            ->value('total_cost');

        return (float) ($totalCost ?? 0);
    }

    /**
     * @return array<string, array{total_sales: float, order_count: int}>
     */
    private function groupedSalesByDay(string $startDate, string $endDate): array
    {
        $rows = Order::query()
            ->where('status', '!=', 'cancelled')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COALESCE(SUM(grand_total), 0) as total_sales')
            ->selectRaw('COUNT(*) as order_count')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('day')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[$row->day] = [
                'total_sales' => (float) ($row->total_sales ?? 0),
                'order_count' => (int) ($row->order_count ?? 0),
            ];
        }

        return $result;
    }

    /**
     * @return array<string, float>
     */
    private function groupedCostByDay(string $startDate, string $endDate): array
    {
        $rows = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->leftJoin('products as p', 'p.id', '=', 'oi.product_id')
            ->where('o.status', '!=', 'cancelled')
            ->whereDate('o.created_at', '>=', $startDate)
            ->whereDate('o.created_at', '<=', $endDate)
            ->selectRaw('DATE(o.created_at) as day')
            ->selectRaw('COALESCE(SUM(oi.quantity * COALESCE(p.cost, 0)), 0) as total_cost')
            ->groupBy(DB::raw('DATE(o.created_at)'))
            ->orderBy('day')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[$row->day] = (float) ($row->total_cost ?? 0);
        }

        return $result;
    }
}
