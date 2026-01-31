<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('staff_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Admin, Cashier, Inventory
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Optional: add some default roles
        DB::table('staff_roles')->insert([
            ['name' => 'Admin', 'description' => 'Full access'],
            ['name' => 'Cashier', 'description' => 'POS access only'],
            ['name' => 'Inventory', 'description' => 'Manage stock'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_roles');
    }
};
