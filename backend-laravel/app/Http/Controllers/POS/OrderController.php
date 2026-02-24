<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\POSService;
use Illuminate\Database\QueryException;
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
        try {
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
        } catch (QueryException $exception) {
            report($exception);
            return $this->dbUnavailableResponse();
        }
    }

    /**
     * Get single order details
     */
    public function show($id)
    {
        try {
            $order = Order::with('items.product', 'user')->findOrFail($id);

            return response()->json($order);
        } catch (QueryException $exception) {
            report($exception);
            return $this->dbUnavailableResponse();
        }
    }

    /**
     * Create a new order
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'discount' => 'nullable|numeric|min:0',
                'payment_method' => 'required|in:cash,card,mobile_money',
                'status' => 'sometimes|in:pending,paid',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
            ]);

            $order = $this->posService->createOrder(
                $validated,
                $request->user()
            );

            return response()->json($order, 201);
        } catch (QueryException $exception) {
            report($exception);
            return $this->dbUnavailableResponse();
        }
    }

    /**
     * Update an existing order (only if pending)
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'discount' => 'nullable|numeric|min:0',
                'payment_method' => 'required|in:cash,card,mobile_money',
                'status' => 'sometimes|in:pending,paid',
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
        } catch (QueryException $exception) {
            report($exception);
            return $this->dbUnavailableResponse();
        }
    }

    /**
     * Complete an order.
     */
    public function complete(Request $request, $id)
    {
        try {
            $order = Order::with('items.product')->findOrFail($id);

            $completedOrder = $this->posService->completeOrder(
                $order,
                $request->user()
            );

            return response()->json($completedOrder);
        } catch (QueryException $exception) {
            report($exception);
            return $this->dbUnavailableResponse();
        }
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, $id)
    {
        try {
            $order = Order::with('items.product')->findOrFail($id);

            $cancelledOrder = $this->posService->cancelOrder(
                $order,
                $request->user()
            );

            return response()->json($cancelledOrder);
        } catch (QueryException $exception) {
            report($exception);
            return $this->dbUnavailableResponse();
        }
    }

    private function dbUnavailableResponse()
    {
        return response()->json([
            'message' => 'Orders are temporarily unavailable due to a database configuration/migration issue.',
        ], 503);
    }
}
