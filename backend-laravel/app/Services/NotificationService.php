<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Log a notification in the database.
     * Can later integrate with push notifications, email, or SMS.
     *
     * @param string $type
     * @param string $message
     * @param array $meta Optional extra data (e.g., order_id, product_id)
     * @return Notification
     */
    public function send(string $type, string $message, array $meta = []): Notification
    {
        $notification = Notification::create([
            'type' => $type,
            'message' => $message,
            'meta' => $meta,
            'sent' => false, // will be set true after push/email/SMS
        ]);

        // TODO: Integrate push notifications here
        // Example:
        // app(PushNotificationService::class)->send($type, $message, $meta);

        return $notification;
    }

    /**
     * Check low stock and create notifications.
     *
     * @param int $threshold
     * @return Collection
     */
    public function checkLowStock(int $threshold = 5): Collection
    {
        $products = Product::where('stock', '<=', $threshold)->get();

        return $products->map(fn($product) => $this->send(
            'low_stock',
            "Product {$product->name} is low on stock ({$product->stock} units left).",
            ['product_id' => $product->id, 'stock' => $product->stock]
        ));
    }

    /**
     * Notify about unpaid orders.
     *
     * @return Collection
     */
    public function notifyUnpaidOrders(): Collection
    {
        $orders = Order::where('payment_status', 'pending')->get();

        return $orders->map(fn($order) => $this->send(
            'unpaid_order',
            "Order #{$order->id} is pending payment.",
            ['order_id' => $order->id]
        ));
    }

    /**
     * Get the latest notifications.
     *
     * @param int $limit
     * @return Collection
     */
    public function latest(int $limit = 50): Collection
    {
        return Notification::latest()->take($limit)->get();
    }
}
