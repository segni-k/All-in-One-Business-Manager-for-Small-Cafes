<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();

            // The product
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // Who did it
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Type of movement
            $table->enum('type', ['sale', 'restock', 'adjustment'])->comment('Sale = removed by POS, restock = added to stock, adjustment = manual correction');

            // Quantity
            $table->integer('quantity');

            // Reference to order, purchase, etc
            $table->string('reference_type')->nullable()->comment('Model name, e.g., Order, Purchase');
            $table->unsignedBigInteger('reference_id')->nullable()->comment('ID of the reference model');

            // Optional notes
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['product_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
