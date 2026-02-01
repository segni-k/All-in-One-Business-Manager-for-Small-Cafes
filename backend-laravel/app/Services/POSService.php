<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Services\InventoryService;

class POSService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    // Create Order
    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'user_id' => $data['user_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'discount' => $data['discount'] ?? 0,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $data['payment_method'] ?? null,
            ]);

            $total = 0;

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if ($product->stock < $itemData['quantity']) {
                    throw new HttpException(422, "Not enough stock for {$product->name}");
                }

                $subtotal = $product->price * $itemData['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                // Reduce stock & log inventory transaction
                $this->inventoryService->removeStock(
                    $product,
                    $itemData['quantity'],
                    $order->id,
                    'Sold via POS'
                );

                $total += $subtotal;
            }

            $order->total = $total;
            $order->grand_total = max(0, $total - ($data['discount'] ?? 0));
            $order->save();

            if ($order->customer_id) {
                $customer = $order->customer;
                // Add loyalty points
                app(\App\Services\CustomerService::class)->addLoyaltyPoints($customer, $order->grand_total);
                // Apply VIP discount if needed
                $order->grand_total = app(\App\Services\CustomerService::class)->applyVipDiscount($customer, $order->grand_total);
                $order->save();
            }


            return $order->load('items.product', 'customer', 'user');
        });
    }

    // Update Order
    public function updateOrder(Order $order, array $data)
    {
        if ($order->payment_status !== 'pending') {
            throw new HttpException(403, 'Cannot edit a paid order');
        }

        return DB::transaction(function () use ($order, $data) {
            $newItems = $data['items'];
            $discount = $data['discount'] ?? 0;

            // Restore old stock & log inventory
            foreach ($order->items as $item) {
                $this->inventoryService->addStock(
                    $item->product,
                    $item->quantity,
                    "Restocked from edited order #{$order->id}"
                );
            }

            $order->items()->delete();
            $total = 0;

            foreach ($newItems as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if ($product->stock < $itemData['quantity']) {
                    throw new HttpException(422, "Not enough stock for {$product->name}");
                }

                $subtotal = $product->price * $itemData['quantity'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                // Reduce stock & log inventory transaction
                $this->inventoryService->removeStock(
                    $product,
                    $itemData['quantity'],
                    $order->id,
                    'Sold via POS (order updated)'
                );

                $total += $subtotal;
            }

            $order->total = $total;
            $order->grand_total = max(0, $total - $discount);
            $order->discount = $discount;
            $order->customer_id = $data['customer_id'] ?? $order->customer_id;
            $order->save();

            return $order->load('items.product', 'customer', 'user');
        });
    }

    // Cancel Order
    public function cancelOrder(Order $order)
    {
        if ($order->status === 'cancelled') {
            throw new HttpException(400, 'Order is already cancelled');
        }

        if (!in_array($order->payment_status, ['pending', 'paid'])) {
            throw new HttpException(403, 'This order cannot be cancelled');
        }

        return DB::transaction(function () use ($order) {
            // Restore stock & log inventory transactions
            foreach ($order->items as $item) {
                $this->inventoryService->addStock(
                    $item->product,
                    $item->quantity,
                    "Restocked from cancelled order #{$order->id}"
                );
            }

            $order->status = 'cancelled';
            if ($order->payment_status === 'paid') {
                $order->payment_status = 'refunded';
            }

            $order->save();

            return $order->load('items.product', 'customer', 'user');
        });
    }
}
