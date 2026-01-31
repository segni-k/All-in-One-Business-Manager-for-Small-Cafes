<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Product;
use App\Models\Order;
use App\Models\Customer;

class NotificationService
{
    // Log a notification (can later integrate SMS/email)
    public function send(string $type, string $message, ?Customer $customer = null): Notification
    {
        $notification = Notification::create([
            'type' => $type,
            'message' => $message,
            'customer_id' => $customer?->id,
            'sent' => false, // set true after real email/SMS
        ]);

        // TODO: Integrate SMS / Email here
        // Example: Mail::to($customer->email)->send(new NotificationMail($message));

        return $notification;
    }

    // Check low stock and send alerts
    public function checkLowStock(int $threshold = 5)
    {
        $products = Product::where('stock', '<=', $threshold)->get();

        foreach ($products as $product) {
            $this->send('low_stock', "Product {$product->name} is low on stock ({$product->stock} units left).");
        }
    }

    // Notify customer for unpaid orders
    public function notifyUnpaidOrders()
    {
        $orders = Order::where('payment_status', 'pending')->get();

        foreach ($orders as $order) {
            $customer = $order->customer;
            if ($customer) {
                $this->send(
                    'unpaid_order',
                    "Dear {$customer->name}, your order #{$order->id} is pending payment.",
                    $customer
                );
            }
        }
    }

    // VIP customer notifications
    public function notifyVipCustomer(Customer $customer, string $message)
    {
        $this->send('vip', $message, $customer);
    }
}
