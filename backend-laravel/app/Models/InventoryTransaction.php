<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'quantity',
        'reference_type',
        'reference_id',
        'notes',
    ];

    /* ======================
     | Relationships
     ====================== */

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /* Polymorphic-like helper */
    public function reference()
    {
        if (!$this->reference_type || !$this->reference_id) {
            return null;
        }

        return app($this->reference_type)::find($this->reference_id);
    }

    /* ======================
     | Helpers
     ====================== */

    public function isInbound(): bool
    {
        return in_array($this->type, ['restock', 'adjustment']);
    }

    public function isOutbound(): bool
    {
        return $this->type === 'sale';
    }
}

