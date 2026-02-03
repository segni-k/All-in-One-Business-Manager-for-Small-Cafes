<?php

namespace Database\Seeders;

use App\Models\StaffRole;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles if not exists
        $admin = StaffRole::firstOrCreate(['name' => 'admin']);
        $manager = StaffRole::firstOrCreate(['name' => 'manager']);
        $cashier = StaffRole::firstOrCreate(['name' => 'cashier']);

        // Create permissions
        $permissions = [
            'manage_staff',
            'view_reports',
            'manage_inventory',
            'use_pos',
            'refund_order'
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        // Assign permissions
        $admin->permissions()->sync(Permission::pluck('id'));
        $manager->permissions()->sync(
            Permission::whereIn('name', ['view_reports','manage_inventory','use_pos','refund_order'])->pluck('id')
        );
        $cashier->permissions()->sync(
            Permission::where('name', 'use_pos')->pluck('id')
        );
    }
}
