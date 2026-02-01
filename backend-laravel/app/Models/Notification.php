<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'message',
        'customer_id',
        'sent'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}

