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
        $adminEmail = env('ADMIN_EMAIL', 'admin@system.local');
        $adminPassword = env('ADMIN_PASSWORD', 'password');
        $adminName = env('ADMIN_NAME', 'System Admin');

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => $adminName,
                'password' => $adminPassword,
                'role_id' => $adminRole->id,
                'is_active' => true,
            ]
        );
    }
}
