<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'sku',
        'category_id',
        'image_url',
        'price',
        'cost',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /* ======================
     | Relationships
     ====================== */

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /* ======================
     | Helpers
     ====================== */

    public function isOutOfStock(): bool
    {
        return $this->stock <= 0;
    }

    public function profitPerUnit(): float
    {
        return (float) ($this->price - $this->cost);
    }

}
