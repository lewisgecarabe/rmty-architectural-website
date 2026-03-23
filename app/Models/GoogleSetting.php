<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class GoogleSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function getValue(string $key): ?string
    {
        return static::where('key', $key)->value('value');
    }

    public static function setValue(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}