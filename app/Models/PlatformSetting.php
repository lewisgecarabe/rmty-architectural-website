<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * PlatformSetting — per-user Facebook/Instagram/Viber tokens
 * File: app/Models/PlatformSetting.php
 */
class PlatformSetting extends Model
{
    protected $fillable = ['user_id', 'platform', 'key', 'value'];

    // ── Per-user methods ──────────────────────────────────────────

    public static function getValue(string $platform, string $key, ?int $userId = null): ?string
    {
        return static::where('user_id', $userId)
            ->where('platform', $platform)
            ->where('key', $key)
            ->value('value');
    }

    public static function setValue(string $platform, string $key, string $value, ?int $userId = null): void
    {
        static::updateOrCreate(
            ['user_id' => $userId, 'platform' => $platform, 'key' => $key],
            ['value' => $value]
        );
    }

    public static function clearPlatform(string $platform, ?int $userId = null): void
    {
        static::where('user_id', $userId)->where('platform', $platform)->delete();
    }

    public static function clearUser(int $userId): void
    {
        static::where('user_id', $userId)->delete();
    }

    // ── Find user_id by their connected Facebook page_id ─────────
    // Used by webhook to identify which user owns the incoming message
    public static function findUserByPageId(string $pageId): ?int
    {
        $record = static::where('platform', 'facebook')
            ->where('key', 'page_id')
            ->where('value', $pageId)
            ->first();
        return $record?->user_id;
    }
}