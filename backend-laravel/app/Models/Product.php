<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $sku
 * @property int|null $category_id
 * @property string|null $image_url
 * @property float|string $price
 * @property float|string $cost
 * @property int $stock
 * @property int|null $low_stock_threshold
 * @property bool $is_active
 */
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

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
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
