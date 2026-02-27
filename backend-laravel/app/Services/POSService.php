<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class POSService
{
    protected InventoryService $inventoryService;
    private ?bool $hasGrandTotalColumn = null;
    private ?bool $hasTotalColumn = null;
    private ?bool $hasPriceColumn = null;
    private ?bool $hasUnitPriceColumn = null;

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
            $status = $data['status'] ?? 'pending';
            $isPaid = $status === 'paid';

            $order = Order::create([
                'user_id' => $user->id,
                'discount' => $data['discount'] ?? 0,
                'status' => $status,
                'payment_status' => $isPaid ? 'paid' : 'pending',
                'payment_method' => $data['payment_method'],
                'paid_at' => $isPaid ? now() : null,
            ]);

            $total = 0;

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if (!$product->is_active) {
                    throw new HttpException(
                        422,
                        "{$product->name} is unavailable"
                    );
                }

                if ($product->stock <= 0) {
                    throw new HttpException(
                        422,
                        "{$product->name} is out of stock"
                    );
                }

                if ($product->stock < $itemData['quantity']) {
                    throw new HttpException(
                        422,
                        "Not enough stock for {$product->name}"
                    );
                }

                $subtotal = $product->price * $itemData['quantity'];

                $orderItemPayload = [
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $subtotal,
                ];

                if ($this->orderItemsHasPriceColumn()) {
                    $orderItemPayload['price'] = $product->price;
                }

                if ($this->orderItemsHasUnitPriceColumn()) {
                    $orderItemPayload['unit_price'] = $product->price;
                }

                OrderItem::create($orderItemPayload);

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

            $orderUpdatePayload = [
                'subtotal' => $total,
            ];

            $grandTotal = max(0, $total - ($data['discount'] ?? 0));

            if ($this->ordersHasGrandTotalColumn()) {
                $orderUpdatePayload['grand_total'] = $grandTotal;
            }

            if ($this->ordersHasTotalColumn()) {
                $orderUpdatePayload['total'] = $grandTotal;
            }

            $order->update($orderUpdatePayload);

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

                if (!$product->is_active) {
                    throw new HttpException(
                        422,
                        "{$product->name} is unavailable"
                    );
                }

                if ($product->stock <= 0) {
                    throw new HttpException(
                        422,
                        "{$product->name} is out of stock"
                    );
                }

                if ($product->stock < $itemData['quantity']) {
                    throw new HttpException(
                        422,
                        "Not enough stock for {$product->name}"
                    );
                }

                $subtotal = $product->price * $itemData['quantity'];

                $orderItemPayload = [
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $subtotal,
                ];

                if ($this->orderItemsHasPriceColumn()) {
                    $orderItemPayload['price'] = $product->price;
                }

                if ($this->orderItemsHasUnitPriceColumn()) {
                    $orderItemPayload['unit_price'] = $product->price;
                }

                OrderItem::create($orderItemPayload);

                $this->inventoryService->removeStock(
                    product: $product,
                    quantity: $itemData['quantity'],
                    user: $user,
                    orderId: $order->id,
                    notes: 'Sold via POS (order updated)'
                );

                $total += $subtotal;
            }

            $orderUpdatePayload = [
                'subtotal' => $total,
                'discount' => $data['discount'] ?? 0,
                'payment_method' => $data['payment_method'],
                'status' => $data['status'] ?? $order->status,
            ];

            $grandTotal = max(0, $total - ($data['discount'] ?? 0));

            if ($this->ordersHasGrandTotalColumn()) {
                $orderUpdatePayload['grand_total'] = $grandTotal;
            }

            if ($this->ordersHasTotalColumn()) {
                $orderUpdatePayload['total'] = $grandTotal;
            }

            $order->update($orderUpdatePayload);

            return $order->load('items.product', 'user');
        });
    }

    /**
     * Complete an order and mark payment as paid.
     */
    public function completeOrder(Order $order, User $user): Order
    {
        if ($order->status === 'cancelled') {
            throw new HttpException(403, 'Cancelled order cannot be completed');
        }

        if ($order->status === 'paid' && $order->payment_status === 'paid') {
            return $order->load('items.product', 'user');
        }

        $order->update([
            'status' => 'paid',
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        return $order->fresh()->load('items.product', 'user');
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

    private function ordersHasGrandTotalColumn(): bool
    {
        if ($this->hasGrandTotalColumn === null) {
            $this->hasGrandTotalColumn = Schema::hasColumn('orders', 'grand_total');
        }

        return $this->hasGrandTotalColumn;
    }

    private function ordersHasTotalColumn(): bool
    {
        if ($this->hasTotalColumn === null) {
            $this->hasTotalColumn = Schema::hasColumn('orders', 'total');
        }

        return $this->hasTotalColumn;
    }

    private function orderItemsHasPriceColumn(): bool
    {
        if ($this->hasPriceColumn === null) {
            $this->hasPriceColumn = Schema::hasColumn('order_items', 'price');
        }

        return $this->hasPriceColumn;
    }

    private function orderItemsHasUnitPriceColumn(): bool
    {
        if ($this->hasUnitPriceColumn === null) {
            $this->hasUnitPriceColumn = Schema::hasColumn('order_items', 'unit_price');
        }

        return $this->hasUnitPriceColumn;
    }
}
