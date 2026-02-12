<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'message',
        'customer_id',
        'sent',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function seenByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'notification_user_reads')
            ->withPivot('read_at')
            ->withTimestamps();
    }
}
