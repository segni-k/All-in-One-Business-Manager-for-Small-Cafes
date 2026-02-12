<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\StaffRole;
use App\Models\User;
use App\Services\POSService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PosProductAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): User
    {
        $role = StaffRole::create([
            'name' => 'Tester',
            'description' => 'Test role',
        ]);

        return User::factory()->create([
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    public function test_create_order_rejects_inactive_product(): void
    {
        $user = $this->createUser();
        $product = Product::create([
            'name' => 'Inactive Product',
            'sku' => 'INACTIVE-1',
            'price' => 5,
            'cost' => 2,
            'stock' => 10,
            'is_active' => false,
        ]);

        $service = app(POSService::class);

        try {
            $service->createOrder([
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
            ], $user);
            $this->fail('Expected HttpException was not thrown.');
        } catch (HttpException $exception) {
            $this->assertSame(422, $exception->getStatusCode());
            $this->assertStringContainsString('unavailable', $exception->getMessage());
        }

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_create_order_rejects_out_of_stock_product(): void
    {
        $user = $this->createUser();
        $product = Product::create([
            'name' => 'Out Product',
            'sku' => 'OUT-1',
            'price' => 5,
            'cost' => 2,
            'stock' => 0,
            'is_active' => true,
        ]);

        $service = app(POSService::class);

        try {
            $service->createOrder([
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
            ], $user);
            $this->fail('Expected HttpException was not thrown.');
        } catch (HttpException $exception) {
            $this->assertSame(422, $exception->getStatusCode());
            $this->assertStringContainsString('out of stock', $exception->getMessage());
        }

        $this->assertDatabaseCount('orders', 0);
    }
}

