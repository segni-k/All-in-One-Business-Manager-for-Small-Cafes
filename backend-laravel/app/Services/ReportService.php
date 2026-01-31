<?php
namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\Carbon;

class ReportService
{
    // Daily Profit/Loss
    public function dailyProfitLoss($date = null)
    {
        $date = $date ? Carbon::parse($date)->toDateString() : Carbon::today()->toDateString();

        $orders = Order::with('items.product')
            ->whereDate('created_at', $date)
            ->where('status','!=','cancelled')
            ->get();

        $totalSales = 0;
        $totalCost = 0;

        foreach($orders as $order){
            $totalSales += $order->grand_total;

            foreach($order->items as $item){
                $cost = $item->product->cost ?? 0; // assuming Product has cost field
                $totalCost += $cost * $item->quantity;
            }
        }

        $profit = $totalSales - $totalCost;

        return [
            'date' => $date,
            'total_sales' => $totalSales,
            'total_cost' => $totalCost,
            'profit' => $profit,
            'orders_count' => $orders->count()
        ];
    }

    // Monthly Profit/Loss
    public function monthlyProfitLoss($month = null, $year = null)
    {
        $month = $month ?? Carbon::now()->month;
        $year = $year ?? Carbon::now()->year;

        $orders = Order::with('items.product')
            ->whereYear('created_at',$year)
            ->whereMonth('created_at',$month)
            ->where('status','!=','cancelled')
            ->get();

        $totalSales = 0;
        $totalCost = 0;

        foreach($orders as $order){
            $totalSales += $order->grand_total;

            foreach($order->items as $item){
                $cost = $item->product->cost ?? 0;
                $totalCost += $cost * $item->quantity;
            }
        }

        $profit = $totalSales - $totalCost;

        return [
            'month' => $month,
            'year' => $year,
            'total_sales' => $totalSales,
            'total_cost' => $totalCost,
            'profit' => $profit,
            'orders_count' => $orders->count()
        ];
    }
}
