<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Services\CustomerService;

class CustomerController extends Controller
{
    protected CustomerService $service;

    public function __construct(CustomerService $service)
    {
        $this->service = $service;
    }

    // List all customers
    public function index()
    {
        return response()->json(Customer::all());
    }

    // Create customer
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'nullable|string|unique:customers,phone',
            'vip_status' => 'nullable|in:none,silver,gold,platinum'
        ]);

        $customer = $this->service->create($data);
        return response()->json($customer, 201);
    }

    // Show single customer
    public function show(Customer $customer)
    {
        return response()->json($customer);
    }

    // Update customer
    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:customers,email,' . $customer->id,
            'phone' => 'sometimes|string|unique:customers,phone,' . $customer->id,
            'vip_status' => 'sometimes|in:none,silver,gold,platinum'
        ]);

        $customer = $this->service->update($customer, $data);
        return response()->json($customer);
    }

    // Delete customer
    public function destroy(Customer $customer)
    {
        $this->service->delete($customer);
        return response()->json(['message' => 'Customer deleted successfully']);
    }

    // Customer order history
    public function orders(Customer $customer)
    {
        $orders = $this->service->getOrderHistory($customer);
        return response()->json($orders);
    }
}

