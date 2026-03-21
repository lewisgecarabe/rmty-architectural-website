<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = ['platform', 'key', 'value'];

    public static function getValue(string $platform, string $key): ?string
    {
        return static::where('platform', $platform)->where('key', $key)->value('value');
    }

    public static function setValue(string $platform, string $key, string $value): void
    {
        static::updateOrCreate(
            ['platform' => $platform, 'key' => $key],
            ['value' => $value]
        );
    }

    public static function clearPlatform(string $platform): void
    {
        static::where('platform', $platform)->delete();
    }
}