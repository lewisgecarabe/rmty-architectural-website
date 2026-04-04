<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * Inquiry Model
 * File: app/Models/Inquiry.php
 *
 * Drop-in alongside your existing models:
 * Project.php, Service.php, Category.php, AboutSection.php
 *
 * @property int         $id
 * @property string      $platform    gmail|facebook|instagram|sms|viber|website
 * @property string|null $external_id Platform's own message ID
 * @property string|null $name
 * @property string|null $email
 * @property string|null $phone
 * @property string      $message
 * @property string      $status      new|replied|archived
 * @property array|null  $raw_payload
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Inquiry extends Model
{
    protected $fillable = [
        'platform',
        'external_id',
        'name',
        'email',
        'phone',
        'message',
        'status',
        'admin_reply',
        'replied_at',
        'raw_payload',
    ];

    protected $casts = [
        'raw_payload' => 'array',
        'replied_at'  => 'datetime',
    ];

    // ─── Query Scopes ──────────────────────────────────────────────

    /** Filter by platform */
    public function scopeForPlatform(Builder $query, string $platform): Builder
    {
        return $query->where('platform', $platform);
    }

    /** Filter by status */
    public function scopeWithStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Search across name, email, phone, and message content.
     * Uses MySQL FULLTEXT on message for performance.
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%")
              ->orWhere('phone', 'like', "%{$term}%")
              ->orWhereFullText('message', $term);
        });
    }

    // ─── Business Logic ────────────────────────────────────────────

    public function markReplied(): void
    {
        $this->update([
            'status'     => 'replied',
            'replied_at' => now(),
        ]);
    }

    public function markArchived(): void
    {
        $this->update(['status' => 'archived']);
    }

    public function markNew(): void
    {
        $this->update(['status' => 'new', 'replied_at' => null]);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    /** Display-friendly platform label */
    public function getPlatformLabelAttribute(): string
    {
        return match ($this->platform) {
            'gmail'     => 'Gmail',
            'facebook'  => 'Facebook',
            'instagram' => 'Instagram',
            'sms'       => 'SMS',
            'viber'     => 'Viber',
            'website'   => 'Website',
            default     => ucfirst($this->platform),
        };
    }
}

