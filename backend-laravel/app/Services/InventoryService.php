<?php

namespace App\Services;

use App\Models\Product;
use App\Models\InventoryTransaction;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InventoryService
{
    /**
     * Default low-stock threshold
     */
    protected int $lowStockThreshold = 5;

    /**
     * Add stock to a product
     *
     * @param Product $product
     * @param int $quantity
     * @param string|null $notes
     * @return Product
     */
    public function addStock(Product $product, int $quantity, ?string $notes = null): Product
    {
        $product->increment('stock', $quantity);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => $quantity,
            'notes' => $notes,
        ]);

        return $product;
    }

    /**
     * Remove stock from a product
     *
     * @param Product $product
     * @param int $quantity
     * @param int|null $orderId
     * @param string|null $notes
     * @return Product
     *
     * @throws HttpException
     */
    public function removeStock(Product $product, int $quantity, ?int $orderId = null, ?string $notes = null): Product
    {
        if ($product->stock < $quantity) {
            throw new HttpException(422, "Not enough stock for {$product->name}");
        }

        $product->decrement('stock', $quantity);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => $quantity,
            'order_id' => $orderId,
            'notes' => $notes,
        ]);

        // Send low stock notification if below threshold
        if ($product->stock <= $this->lowStockThreshold) {
            if (app()->bound('NotificationService')) {
                app(\App\Services\NotificationService::class)->send(
                    'low_stock',
                    "Product {$product->name} is low on stock ({$product->stock})"
                );
            }
        }

        return $product;
    }

    /**
     * Get current stock of a product
     */
    public function getStock(Product $product): int
    {
        return $product->stock;
    }

    /**
     * Get all products below the threshold
     */
    public function getLowStockProducts()
    {
        return Product::where('stock', '<=', $this->lowStockThreshold)->get();
    }

    /**
     * Set a dynamic low-stock threshold
     */
    public function setLowStockThreshold(int $threshold): void
    {
        $this->lowStockThreshold = $threshold;
    }
}

