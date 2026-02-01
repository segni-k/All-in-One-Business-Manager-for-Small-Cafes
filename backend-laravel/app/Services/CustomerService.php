<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CustomerService
{
    // Create customer
    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    // Update customer
    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);
        return $customer;
    }

    // Delete customer
    public function delete(Customer $customer): void
    {
        $customer->delete();
    }

    // Get order history for a customer
    public function getOrderHistory(Customer $customer)
    {
        return $customer->orders()
            ->with('items.product', 'user')
            ->latest()
            ->get();
    }

    // Add loyalty points (e.g., 1 point per $10 spent)
    public function addLoyaltyPoints(Customer $customer, float $orderTotal)
    {
        $points = floor($orderTotal / 10); 
        $customer->addPoints($points);

        // Check VIP upgrade automatically
        $this->checkVipStatus($customer);
    }

    // Check and upgrade VIP status
    protected function checkVipStatus(Customer $customer)
    {
        $notificationService = app(\App\Services\NotificationService::class);

        // VIP tiers thresholds
        $tiers = [
            'silver' => 50,
            'gold' => 100,
            'platinum' => 200,
        ];

        foreach ($tiers as $tier => $threshold) {
            if ($customer->loyalty_points >= $threshold && $customer->vip_status !== $tier) {
                $customer->vip_status = $tier;
                $customer->save();

                $notificationService->notifyVipCustomer(
                    $customer,
                    "Congratulations {$customer->name}, you are now a {$tier} VIP member!"
                );
            }
        }
    }

    // Apply VIP discount based on status
    public function applyVipDiscount(Customer $customer, float $amount): float
    {
        $discounts = [
            'none' => 0,
            'silver' => 0.05,
            'gold' => 0.10,
            'platinum' => 0.15,
        ];

        $rate = $discounts[$customer->vip_status] ?? 0;
        return $amount * (1 - $rate);
    }
}
