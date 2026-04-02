<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * GoogleSetting — per-user Gmail OAuth tokens
 * File: app/Models/GoogleSetting.php
 */
class GoogleSetting extends Model
{
    protected $fillable = ['user_id', 'key', 'value'];

    // ── Per-user methods (used in OAuth controllers + senders) ────

    public static function getValue(string $key, ?int $userId = null): ?string
    {
        return static::where('key', $key)
            ->where('user_id', $userId)
            ->value('value');
    }

    public static function setValue(string $key, string $value, ?int $userId = null): void
    {
        static::updateOrCreate(
            ['user_id' => $userId, 'key' => $key],
            ['value' => $value]
        );
    }

    public static function deleteValue(string $key, ?int $userId = null): void
    {
        static::where('user_id', $userId)->where('key', $key)->delete();
    }

    public static function clearUser(int $userId): void
    {
        static::where('user_id', $userId)->delete();
    }

    // ── Find user_id by their connected Gmail address ─────────────
    // Used by webhook to identify which user owns the incoming email
    public static function findUserByEmail(string $email): ?int
    {
        $record = static::where('key', 'connected_email')
            ->where('value', $email)
            ->first();
        return $record?->user_id;
    }
}