<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Permission;


class StaffRole extends Model
{
    protected $fillable = ['name', 'description'];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission', 'role_id', 'permission_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
