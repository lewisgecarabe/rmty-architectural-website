<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'is_admin',
        'archived_at',
        'profile_photo',
        'otp',
        'otp_code',          // ✅ ADD
    'otp_expires_at',    // ✅ ADD
];

    protected $casts = [
        'archived_at' => 'datetime',
        'email_verified_at' => 'datetime',
    'otp_expires_at'    => 'datetime', // ← add this
    ];

    protected $appends = ['profile_photo_url'];

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function getProfilePhotoUrlAttribute(): string
    {
        if ($this->profile_photo) {
            return Storage::url($this->profile_photo);
        }

        // Fallback to DiceBear avatar using their name as seed
        $seed = urlencode($this->first_name ?? $this->name ?? 'admin');
        return "https://api.dicebear.com/7.x/avataaars/svg?seed={$seed}";
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];
}