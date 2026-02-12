<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Permission;
use App\Models\StaffRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithPermissions(array $permissionNames): User
    {
        $role = StaffRole::create([
            'name' => 'role_' . uniqid(),
            'description' => 'test role',
        ]);

        foreach ($permissionNames as $permissionName) {
            $permission = Permission::firstOrCreate(['name' => $permissionName]);
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        }

        return User::factory()->create([
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    public function test_notifications_endpoint_returns_data_for_authorized_user(): void
    {
        $user = $this->createUserWithPermissions(['use_pos']);

        $n1 = Notification::create([
            'type' => 'low_stock',
            'message' => 'Milk is low',
            'sent' => false,
        ]);

        Notification::create([
            'type' => 'unpaid_order',
            'message' => 'Order #12 unpaid',
            'sent' => false,
        ]);

        $user->seenNotifications()->syncWithoutDetaching([
            $n1->id => ['read_at' => now()],
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'type', 'message', 'data', 'read_at', 'created_at', 'updated_at'],
            ],
            'unseen_count',
        ]);
        $response->assertJsonPath('unseen_count', 1);
    }

    public function test_notifications_endpoint_forbidden_without_use_pos_permission(): void
    {
        $user = $this->createUserWithPermissions([]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications');

        $response->assertStatus(403);
    }
}

