<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class POSService
{
    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {

            $order = Order::create([
                'user_id' => $data['user_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'discount' => $data['discount'] ?? 0,
            ]);

            $total = 0;

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if ($product->stock < $itemData['quantity']) {
                    throw new HttpException(
                        422,
                        "Not enough stock for {$product->name}"
                    );
                }

                $subtotal = $product->price * $itemData['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                // Decrement stock
                $product->decrement('stock', $itemData['quantity']);
                $total += $subtotal;
            }

            // ---- FIXED DISCOUNT RULE ----
            $discount = $data['discount'] ?? 0;

            // If you want to support percentage discounts later, use:
            // if (isset($data['discount_type']) && $data['discount_type'] === 'percent') {
            //     $discount = ($discount / 100) * $total;
            // }

            // Never allow grand total to be negative
            $grandTotal = max(0, $total - $discount);

            $order->total = $total;
            $order->grand_total = $grandTotal;
            $order->save();

            return $order->load('items.product', 'customer', 'user');
        });
    }
}
