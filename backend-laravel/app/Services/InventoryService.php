<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use App\Models\InventoryTransaction;
use App\Enums\InventoryType;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InventoryService
{
    /**
     * Default low-stock threshold
     */
    protected int $lowStockThreshold = 5;

    /**
     * Restock a product
     */
    public function addStock(
        Product $product,
        int $quantity,
        ?User $user = null,
        ?string $notes = null
    ): Product {
        if ($quantity <= 0) {
            throw new HttpException(422, 'Quantity must be greater than zero');
        }

        $product->increment('stock', $quantity);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'type' => InventoryType::RESTOCK,
            'quantity' => $quantity,
            'notes' => $notes,
        ]);

        return $product->refresh();
    }

    /**
     * Remove stock (POS sale, etc.)
     */
    public function removeStock(
        Product $product,
        int $quantity,
        ?User $user = null,
        ?int $orderId = null,
        ?string $notes = null
    ): Product {
        if ($quantity <= 0) {
            throw new HttpException(422, 'Quantity must be greater than zero');
        }

        if ($product->stock < $quantity) {
            throw new HttpException(
                422,
                "Not enough stock for {$product->name}. Available: {$product->stock}"
            );
        }

        $product->decrement('stock', $quantity);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'type' => InventoryType::SALE,
            'quantity' => $quantity,
            'reference_type' => Order::class,
            'reference_id' => $orderId,
            'notes' => $notes,
        ]);

        $this->checkLowStock($product);

        return $product->refresh();
    }

    /**
     * Manual stock adjustment
     */
    public function adjustStock(
        Product $product,
        int $newStock,
        ?User $user = null,
        ?string $notes = null
    ): Product {
        if ($newStock < 0) {
            throw new HttpException(422, 'Stock cannot be negative');
        }

        $difference = $newStock - $product->stock;

        if ($difference === 0) {
            return $product;
        }

        $product->update(['stock' => $newStock]);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'type' => InventoryType::ADJUSTMENT,
            'quantity' => abs($difference),
            'notes' => $notes ?? 'Manual stock adjustment',
        ]);

        $this->checkLowStock($product);

        return $product->refresh();
    }

    /**
     * Get current stock
     */
    public function getStock(Product $product): int
    {
        return $product->stock;
    }

    /**
     * Get low-stock products
     */
    public function getLowStockProducts()
    {
        return Product::where('stock', '<=', $this->lowStockThreshold)->get();
    }

    /**
     * Change low-stock threshold
     */
    public function setLowStockThreshold(int $threshold): void
    {
        if ($threshold < 1) {
            throw new HttpException(422, 'Threshold must be at least 1');
        }

        $this->lowStockThreshold = $threshold;
    }

    /**
     * Handle low-stock notification
     */
    protected function checkLowStock(Product $product): void
    {
        if ($product->stock > $this->lowStockThreshold) {
            return;
        }

        if (app()->bound(\App\Services\NotificationService::class)) {
            app(\App\Services\NotificationService::class)->send(
                'low_stock',
                "Product {$product->name} is low on stock ({$product->stock})"
            );
        }
    }
}
