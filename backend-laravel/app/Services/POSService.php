<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
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
     * Create a new order
     */
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {

            $order = Order::create([
                'user_id' => $data['user_id'],
                'discount' => $data['discount'] ?? 0,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $data['payment_method'],
            ]);

            $total = 0;

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if ($product->stock < $itemData['quantity']) {
                    throw new HttpException(422, "Not enough stock for {$product->name}");
                }

                $subtotal = $product->price * $itemData['quantity'];

                // Create order item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                // Deduct stock and log inventory transaction
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

            return $order->load('items.product', 'user');
        });
    }

    /**
     * Update existing order (only if not paid)
     */
    public function updateOrder(Order $order, array $data): Order
    {
        if ($order->payment_status !== 'pending') {
            throw new HttpException(403, 'Cannot edit a paid order');
        }

        return DB::transaction(function () use ($order, $data) {

            // Restore stock from old items
            foreach ($order->items as $item) {
                $this->inventoryService->addStock(
                    $item->product,
                    $item->quantity,
                    "Restocked from edited order #{$order->id}"
                );
            }

            // Remove old items
            $order->items()->delete();

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

                $this->inventoryService->removeStock(
                    $product,
                    $itemData['quantity'],
                    $order->id,
                    'Sold via POS (order updated)'
                );

                $total += $subtotal;
            }

            $order->total = $total;
            $order->grand_total = max(0, $total - ($data['discount'] ?? 0));
            $order->discount = $data['discount'] ?? 0;
            $order->payment_method = $data['payment_method'];
            $order->save();

            return $order->load('items.product', 'user');
        });
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Order $order): Order
    {
        if ($order->status === 'cancelled') {
            throw new HttpException(400, 'Order is already cancelled');
        }

        if (!in_array($order->payment_status, ['pending', 'paid'])) {
            throw new HttpException(403, 'This order cannot be cancelled');
        }

        return DB::transaction(function () use ($order) {

            // Restore stock
            foreach ($order->items as $item) {
                $this->inventoryService->addStock(
                    $item->product,
                    $item->quantity,
                    "Restocked from cancelled order #{$order->id}"
                );
            }

            // Update status and payment
            $order->status = 'cancelled';
            if ($order->payment_status === 'paid') {
                $order->payment_status = 'refunded';
            }
            $order->save();

            return $order->load('items.product', 'user');
        });
    }
}
