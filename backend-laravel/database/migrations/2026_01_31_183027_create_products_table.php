<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Core
            $table->string('name');
            $table->string('sku')->nullable()->unique(); // barcode / SKU
            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // Pricing
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2)->default(0);

            // Inventory
            $table->integer('stock')->default(0);

            // Control
            $table->boolean('is_active')->default(true);

            // Safety
            $table->softDeletes();
            $table->timestamps();

            // Performance
            $table->index(['name', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
