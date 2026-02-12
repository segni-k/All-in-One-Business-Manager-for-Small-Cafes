<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List products (POS + Admin)
     * - paginated
     * - searchable
     * - active-only by default
     */
    public function index(Request $request)
    {
        $withInactive = $request->boolean('with_inactive');

        $products = Product::query()
            ->when($withInactive, fn ($q) => $q->withTrashed())
            ->when(!$withInactive, fn ($q) => $q->where('is_active', true))
            ->when(
                $request->filled('search'),
                fn ($q) =>
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('sku', 'like', '%' . $request->search . '%')
            )
            ->with('category:id,name')
            ->latest()
            ->paginate(10);

        return response()->json($products);
    }

    /**
     * Store a new product (Admin / Manager only)
     */
    public function store(StoreProductRequest $request)
    {
        $product = Product::create($request->validated());

        return response()->json([
            'message' => 'Product created successfully',
            'data' => $product->load('category'),
        ], 201);
    }

    /**
     * Show single product details
     */
    public function show(Product $product)
    {
        return response()->json(
            $product->load('category')
        );
    }

    /**
     * Update product (Admin / Manager only)
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product->fresh()->load('category'),
        ]);
    }

    /**
     * Soft-disable product (safe for orders history)
     */
    public function destroy(Product $product)
    {
        $product->update(['is_active' => false]);

        return response()->json([
            'message' => 'Product disabled successfully'
        ]);
    }

    /**
     * Restore a soft-deleted product (Admin only)
     */
    public function restore(int $id)
    {
        $product = Product::withTrashed()->findOrFail($id);

        $product->restore();

        return response()->json([
            'message' => 'Product restored successfully',
            'data' => $product->fresh()->load('category'),
        ]);
    }

    /**
     * List all categories for product forms.
     */
    public function categories()
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Create a product category.
     */
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }
}
