<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\POSService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected POSService $posService;

    public function __construct(POSService $posService)
    {
        $this->posService = $posService;
    }

    /**
     * List orders with pagination and optional filters
     */
    public function index(Request $request)
    {
        $query = Order::with('items.product', 'user')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        return response()->json(
            $query->paginate(25)
        );
    }

    /**
     * Get single order details
     */
    public function show($id)
    {
        $order = Order::with('items.product', 'user')->findOrFail($id);

        return response()->json($order);
    }

    /**
     * Create a new order
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,card,mobile_money',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = $this->posService->createOrder(
            $validated,
            $request->user() // ✅ FIX
        );

        return response()->json($order, 201);
    }

    /**
     * Update an existing order (only if pending)
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,card,mobile_money',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = Order::with('items.product')->findOrFail($id);

        $updatedOrder = $this->posService->updateOrder(
            $order,
            $validated,
            $request->user()
        );

        return response()->json($updatedOrder);
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, $id)
    {
        $order = Order::with('items.product')->findOrFail($id);

        $cancelledOrder = $this->posService->cancelOrder(
            $order,
            $request->user()
        );

        return response()->json($cancelledOrder);
    }
}


