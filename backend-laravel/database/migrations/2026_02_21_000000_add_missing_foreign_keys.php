<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products') && Schema::hasTable('categories')) {
            try {
                Schema::table('products', function (Blueprint $table) {
                    $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
                });
            } catch (Throwable $e) {
            }
        }

        if (Schema::hasTable('order_items') && Schema::hasTable('products')) {
            try {
                Schema::table('order_items', function (Blueprint $table) {
                    $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
                });
            } catch (Throwable $e) {
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            try {
                Schema::table('products', function (Blueprint $table) {
                    $table->dropForeign(['category_id']);
                });
            } catch (Throwable $e) {
            }
        }

        if (Schema::hasTable('order_items')) {
            try {
                Schema::table('order_items', function (Blueprint $table) {
                    $table->dropForeign(['product_id']);
                });
            } catch (Throwable $e) {
            }
        }
    }
};
