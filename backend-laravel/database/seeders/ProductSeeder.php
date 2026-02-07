<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Optional: create some categories
        $categories = [
            'Beverages',
            'Snacks',
            'Main Course',
            'Desserts',
        ];

        foreach ($categories as $catName) {
            Category::firstOrCreate(['name' => $catName]);
        }

        $categoryIds = Category::pluck('id')->toArray();

        // Seed products
        $products = [
            [
                'name' => 'Coca-Cola 500ml',
                'sku' => 'BEV-001',
                'category_id' => $categoryIds[0],
                'price' => 2.5,
                'cost' => 1.0,
                'stock' => 100,
                'is_active' => true,
            ],
            [
                'name' => 'Chips - Potato',
                'sku' => 'SNK-001',
                'category_id' => $categoryIds[1],
                'price' => 1.5,
                'cost' => 0.5,
                'stock' => 200,
                'is_active' => true,
            ],
            [
                'name' => 'Grilled Chicken',
                'sku' => 'MAIN-001',
                'category_id' => $categoryIds[2],
                'price' => 12.0,
                'cost' => 6.0,
                'stock' => 50,
                'is_active' => true,
            ],
            [
                'name' => 'Chocolate Cake Slice',
                'sku' => 'DES-001',
                'category_id' => $categoryIds[3],
                'price' => 4.0,
                'cost' => 2.0,
                'stock' => 30,
                'is_active' => true,
            ],
        ];

        foreach ($products as $p) {
            Product::firstOrCreate(
                ['sku' => $p['sku']],
                $p
            );
        }
    }
}
