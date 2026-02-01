<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'loyalty_points',
        'vip_status'
    ];

    // Customer's orders
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    // Increase loyalty points
    public function addPoints(int $points): void
    {
        $this->increment('loyalty_points', $points);
    }

    // Reset loyalty points
    public function resetPoints(): void
    {
        $this->update(['loyalty_points' => 0]);
    }
}

