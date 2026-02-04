<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\POSService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

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

        // Optional filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $orders = $query->paginate(25); // paginated for production

        return response()->json($orders);
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
        $request->validate([
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,card,mobile_money',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $order = $this->posService->createOrder($data);

        return response()->json($order, 201);
    }

    /**
     * Update an existing order (only if pending)
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,card,mobile_money',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = Order::with('items.product')->findOrFail($id);

        if ($order->payment_status !== 'pending') {
            return response()->json([
                'message' => 'Cannot edit a paid order'
            ], 403);
        }

        $order = $this->posService->updateOrder($order, $request->all());

        return response()->json($order);
    }

    /**
     * Cancel an order (pending or paid)
     */
    public function cancel($id)
    {
        $order = Order::with('items.product')->findOrFail($id);

        $order = $this->posService->cancelOrder($order);

        return response()->json($order);
    }
}


