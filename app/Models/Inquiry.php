<?php

namespace App\Models;

use App\Services\ReferenceIdService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_id',    // ← NEW
        'platform',
        'external_id',
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'status',
        'admin_reply',
        'replied_at',
        'raw_payload',
        'thread_url',
    ];

    protected $casts = [
        'raw_payload' => 'array',
        'replied_at'  => 'datetime',
    ];

    // ── Auto-generate reference_id on creation ────────────────────────────
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->reference_id)) {
                $model->reference_id = ReferenceIdService::forInquiry();
            }
        });
    }

    // ── Status helpers ────────────────────────────────────────────────────
    public function markReplied(): void
    {
        $this->update(['status' => 'replied', 'replied_at' => now()]);
    }

    public function markArchived(): void
    {
        $this->update(['status' => 'archived']);
    }

    public function markNew(): void
    {
        $this->update(['status' => 'new', 'replied_at' => null]);
    }

    // ── Scopes ────────────────────────────────────────────────────────────
    public function scopeForPlatform(Builder $query, string $platform): Builder
    {
        return $query->where('platform', $platform);
    }

    public function scopeWithStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('name',         'like', "%{$term}%")
              ->orWhere('email',      'like', "%{$term}%")
              ->orWhere('phone',      'like', "%{$term}%")
              ->orWhere('message',    'like', "%{$term}%")
              ->orWhere('reference_id','like', "%{$term}%");   // ← NEW
        });
    }
}