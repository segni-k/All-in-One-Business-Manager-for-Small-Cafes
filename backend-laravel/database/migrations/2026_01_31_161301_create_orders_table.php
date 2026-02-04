<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Staff (cashier / manager)
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Pricing
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2)->default(0);

            // Order lifecycle
            $table->enum('status', ['pending', 'paid', 'cancelled', 'refunded'])
                ->default('pending');

            // Payment
            $table->enum('payment_method', ['cash', 'card', 'mobile_money'])
                ->nullable();

            $table->enum('payment_status', ['pending', 'paid', 'refunded'])
                ->default('pending');

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

