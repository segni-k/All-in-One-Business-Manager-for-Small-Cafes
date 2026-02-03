<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\StaffRole;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = StaffRole::where('name', 'admin')->firstOrFail();

        User::updateOrCreate(
            ['email' => 'admin@system.local'],
            [
                'name' => 'System Admin',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'is_active' => true,
            ]
        );
    }
}
