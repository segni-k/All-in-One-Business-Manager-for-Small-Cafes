<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;


/**
 * @method \Laravel\Sanctum\NewAccessToken createToken(string $name, array $abilities = ['*'])
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'is_active'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];


    public function role()
    {
        return $this->belongsTo(StaffRole::class, 'role_id');
    }

    // Mutator for password hashing
    public function setPasswordAttribute($password)
    {
        if (! empty($password)) {
            $this->attributes['password'] = Hash::make($password);
        }
    }

    public function isAdmin(): bool
    {
        return strtolower($this->role?->name ?? '') === 'admin';
    }

    /*

     public function hasPermission(string $permission): bool
     {
        return $this->role
            ->permissions
          ->pluck('name')
        ->contains($permission);
     }
    */
    public function hasPermission(string $permission): bool
    {
        return $this->role?->permissions?->pluck('name')->contains($permission) ?? false;
    }


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
