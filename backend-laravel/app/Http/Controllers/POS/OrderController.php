<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Services\POSService;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected $posService;

    public function __construct(POSService $posService)
    {
        $this->posService = $posService;
    }

    public function index()
    {
        return Order::with('items.product', 'customer', 'user')->latest()->get();
    }

    public function show($id)
    {
        return Order::with('items.product', 'customer', 'user')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $order = $this->posService->createOrder($data);

        return response()->json($order, 201);
    }


    public function cancel($id)
{
    $order = Order::with('items.product')->findOrFail($id);

    if ($order->status === 'cancelled') {
        return response()->json([
            'message' => 'Order is already cancelled'
        ], 400);
    }

    // Only allow cancelling pending or paid orders
    if (!in_array($order->payment_status, ['pending', 'paid'])) {
        return response()->json([
            'message' => 'This order cannot be cancelled'
        ], 403);
    }

    return DB::transaction(function () use ($order) {

        // 1️⃣ Restore stock
        foreach ($order->items as $item) {
            $item->product->increment('stock', $item->quantity);
        }

        // 2️⃣ Update order status and payment status
        $order->status = 'cancelled';
        if ($order->payment_status === 'paid') {
            $order->payment_status = 'refunded';
        }
        $order->save();

        // 3️⃣ Return full order details
        return $order->load('items.product', 'customer', 'user');
    });
}



    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'discount' => 'nullable|numeric|min:0',
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

        return DB::transaction(function () use ($request, $order) {

            $newItems = $request->items;
            $discount = $request->discount ?? 0;

            // 1️⃣ Restore old stock
            foreach ($order->items as $item) {
                $item->product->increment('stock', $item->quantity);
            }

            // 2️⃣ Delete old items
            $order->items()->delete();

            $total = 0;

            // 3️⃣ Create new items
            foreach ($newItems as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if ($product->stock < $itemData['quantity']) {
                    throw new \Symfony\Component\HttpKernel\Exception\HttpException(
                        422,
                        "Not enough stock for {$product->name}"
                    );
                }

                $subtotal = $product->price * $itemData['quantity'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                // Decrement stock
                $product->decrement('stock', $itemData['quantity']);
                $total += $subtotal;
            }

            // 4️⃣ Recalculate totals
            $order->total = $total;
            $order->grand_total = max(0, $total - $discount);
            $order->discount = $discount;
            $order->customer_id = $request->customer_id ?? $order->customer_id;
            $order->save();

            return $order->load('items.product', 'customer', 'user');
        });
    }



    // Optional: update / delete methods
}
