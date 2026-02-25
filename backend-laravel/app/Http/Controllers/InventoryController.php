<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function transactions(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['nullable', 'integer', Rule::exists('products', 'id')],
            'type' => ['nullable', 'string', Rule::in(['sale', 'restock', 'adjustment'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $perPage = $validated['per_page'] ?? 25;

        $query = InventoryTransaction::query()
            ->with([
                'product:id,name,sku,stock,is_active',
                'user:id,name,email',
            ])
            ->when($validated['product_id'] ?? null, fn ($q, $productId) => $q->where('product_id', $productId))
            ->when($validated['type'] ?? null, fn ($q, $type) => $q->where('type', $type))
            ->when($validated['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($validated['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->latest();

        return response()->json($query->paginate($perPage));
    }

    public function restock(Request $request, InventoryService $inventoryService)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        $updatedProduct = $inventoryService->addStock(
            product: $product,
            quantity: (int) $validated['quantity'],
            user: $request->user(),
            notes: $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Stock restocked successfully.',
            'data' => $updatedProduct->load('category'),
        ], 201);
    }

    public function adjust(Request $request, InventoryService $inventoryService)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'new_stock' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        $updatedProduct = $inventoryService->adjustStock(
            product: $product,
            newStock: (int) $validated['new_stock'],
            user: $request->user(),
            notes: $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Stock adjusted successfully.',
            'data' => $updatedProduct->load('category'),
        ]);
    }
}
