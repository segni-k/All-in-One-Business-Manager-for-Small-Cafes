<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class POSService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Create a new POS order
     */
    public function createOrder(array $data, User $user): Order
    {
        return DB::transaction(function () use ($data, $user) {

            $order = Order::create([
                'user_id' => $user->id,
                'discount' => $data['discount'] ?? 0,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $data['payment_method'],
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

                // Deduct stock + log inventory transaction
                $this->inventoryService->removeStock(
                    product: $product,
                    quantity: $itemData['quantity'],
                    user: $user,
                    orderId: $order->id,
                    notes: 'Sold via POS'
                );

                $total += $subtotal;
            }

            $order->update([
                'total' => $total,
                'grand_total' => max(0, $total - ($data['discount'] ?? 0)),
            ]);

            return $order->load('items.product', 'user');
        });
    }

    /**
     * Update an existing order (only if not paid)
     */
    public function updateOrder(Order $order, array $data, User $user): Order
    {
        if ($order->payment_status !== 'pending') {
            throw new HttpException(403, 'Cannot edit a paid order');
        }

        return DB::transaction(function () use ($order, $data, $user) {

            // Restore stock from old items
            foreach ($order->items as $item) {
                $this->inventoryService->addStock(
                    product: $item->product,
                    quantity: $item->quantity,
                    user: $user,
                    notes: "Restocked from edited order #{$order->id}"
                );
            }

            // Remove old order items
            $order->items()->delete();

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

                $this->inventoryService->removeStock(
                    product: $product,
                    quantity: $itemData['quantity'],
                    user: $user,
                    orderId: $order->id,
                    notes: 'Sold via POS (order updated)'
                );

                $total += $subtotal;
            }

            $order->update([
                'total' => $total,
                'grand_total' => max(0, $total - ($data['discount'] ?? 0)),
                'discount' => $data['discount'] ?? 0,
                'payment_method' => $data['payment_method'],
            ]);

            return $order->load('items.product', 'user');
        });
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Order $order, User $user): Order
    {
        if ($order->status === 'cancelled') {
            throw new HttpException(400, 'Order is already cancelled');
        }

        if (!in_array($order->payment_status, ['pending', 'paid'])) {
            throw new HttpException(403, 'This order cannot be cancelled');
        }

        return DB::transaction(function () use ($order, $user) {

            // Restore stock
            foreach ($order->items as $item) {
                $this->inventoryService->addStock(
                    product: $item->product,
                    quantity: $item->quantity,
                    user: $user,
                    notes: "Restocked from cancelled order #{$order->id}"
                );
            }

            $order->status = 'cancelled';

            if ($order->payment_status === 'paid') {
                $order->payment_status = 'refunded';
            }

            $order->save();

            return $order->load('items.product', 'user');
        });
    }
}
