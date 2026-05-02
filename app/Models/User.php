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
        'role',
        'archived_at',
        'profile_photo',
        'otp',
        'otp_code',
        'otp_expires_at',
        'login_attempts',
        'locked_until',
        'last_reset_request_at',
    ];

    protected $casts = [
        'archived_at'           => 'datetime',
        'email_verified_at'     => 'datetime',
        'otp_expires_at'        => 'datetime',
        'locked_until'          => 'datetime',
        'last_reset_request_at' => 'datetime',
    ];

    protected $appends = ['profile_photo_url'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // ── Role sync logic ────────────────────────────────────────────────────
    //
    // Rules:
    //   - New users with is_admin = 0  → role = 'customer'  (always)
    //   - New users with is_admin = 1  → role = 'admin'     (unless role already set)
    //   - Existing users               → role is NOT touched by this hook
    //     so promote() can set 'super_admin' freely and it will persist.
    //
    // is_admin is kept in sync the other direction:
    //   - role = 'customer'            → is_admin = 0
    //   - role = 'admin'/'super_admin' → is_admin = 1

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (! $user->is_admin) {
                // New client registration — always customer
                $user->role     = 'customer';
                $user->is_admin = 0;
            } else {
                // Seeded / manually created admin — default to 'admin'
                // unless a more specific role was already provided
                if (! in_array($user->role, ['admin', 'super_admin'])) {
                    $user->role = 'admin';
                }
                $user->is_admin = 1;
            }
        });

        static::updating(function (User $user) {
            // If role was explicitly changed, keep is_admin in sync
            if ($user->isDirty('role')) {
                $user->is_admin = $user->role !== 'customer' ? 1 : 0;
            }

            // If is_admin was explicitly toggled (but role wasn't touched),
            // only set a default role — do NOT overwrite super_admin
            if ($user->isDirty('is_admin') && ! $user->isDirty('role')) {
                if (! $user->is_admin) {
                    $user->role = 'customer';
                } elseif (! in_array($user->role, ['admin', 'super_admin'])) {
                    $user->role = 'admin';
                }
            }
        });
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function passwordHistories()
    {
        return $this->hasMany(PasswordHistory::class)->latest();
    }

    // ── Role helpers ───────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    // ── Lockout helpers ────────────────────────────────────────────────────

    public function isLocked(): bool
    {
        return $this->locked_until && now()->lt($this->locked_until);
    }

    public function lockoutSecondsRemaining(): int
    {
        return $this->isLocked() ? (int) now()->diffInSeconds($this->locked_until) : 0;
    }

    public function incrementLoginAttempts(): void
    {
        $this->increment('login_attempts');
        $this->refresh();

        if ($this->login_attempts >= 5) {
            $this->updateQuietly(['locked_until' => now()->addMinutes(1)]);
        }
    }

    public function resetLoginAttempts(): void
    {
        $this->updateQuietly([
            'login_attempts' => 0,
            'locked_until'   => null,
        ]);
    }

    // ── Reset throttle ─────────────────────────────────────────────────────

    public function canRequestReset(int $cooldownSeconds = 60): bool
    {
        if (! $this->last_reset_request_at) {
            return true;
        }
        return now()->diffInSeconds($this->last_reset_request_at) >= $cooldownSeconds;
    }

    // ── Password history ───────────────────────────────────────────────────

    public function hasUsedPassword(string $plainPassword): bool
    {
        return $this->passwordHistories()
            ->get()
            ->contains(fn ($h) => \Illuminate\Support\Facades\Hash::check($plainPassword, $h->password));
    }

    public function pushPasswordHistory(): void
    {
        $this->passwordHistories()->create(['password' => $this->password]);

        // MariaDB doesn't support OFFSET without LIMIT, so we collect IDs in PHP
        $keepIds = $this->passwordHistories()
            ->limit(5)
            ->pluck('id');

        if ($keepIds->isNotEmpty()) {
            $this->passwordHistories()
                ->whereNotIn('id', $keepIds)
                ->delete();
        }
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function getProfilePhotoUrlAttribute(): string
    {
        if ($this->profile_photo) {
            return Storage::url($this->profile_photo);
        }

        $seed = urlencode($this->first_name ?? $this->name ?? 'user');
        return "https://api.dicebear.com/7.x/avataaars/svg?seed={$seed}";
    }
}