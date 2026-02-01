<?php

namespace App\Services;

use App\Models\Product;
use App\Models\InventoryTransaction;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InventoryService
{
    protected int $lowStockThreshold = 5; // configurable default threshold

    // Add stock
    public function addStock(Product $product, int $quantity, string $notes = null)
    {
        $product->increment('stock', $quantity);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => $quantity,
            'notes' => $notes
        ]);

        return $product;
    }

    // Remove stock
    public function removeStock(Product $product, int $quantity, $order_id = null, string $notes = null)
    {
        if ($product->stock < $quantity) {
            throw new HttpException(422, "Not enough stock for {$product->name}");
        }

        $product->decrement('stock', $quantity);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => $quantity,
            'order_id' => $order_id,
            'notes' => $notes
        ]);

        // Check for low stock and send notification
        if ($product->stock <= $this->lowStockThreshold) {
            app(\App\Services\NotificationService::class)->send(
                'low_stock',
                "Product {$product->name} is low on stock ({$product->stock})."
            );
        }

        return $product;
    }

    // Get current stock
    public function getStock(Product $product): int
    {
        return $product->stock;
    }

    // Optional: get all products below threshold
    public function getLowStockProducts(): \Illuminate\Support\Collection
    {
        return Product::where('stock', '<=', $this->lowStockThreshold)->get();
    }

    // Optionally, allow dynamic threshold
    public function setLowStockThreshold(int $threshold): void
    {
        $this->lowStockThreshold = $threshold;
    }
}

