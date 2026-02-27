<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subtotal',
        'discount',
        'grand_total',
        'total',
        'status',
        'payment_status',
        'payment_method',
        'paid_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    protected $appends = [
        'total',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getTotalAttribute(): float
    {
        $grandTotal = $this->attributes['grand_total'] ?? null;
        if ($grandTotal !== null) {
            return (float) $grandTotal;
        }

        return (float) ($this->attributes['total'] ?? 0);
    }
}
