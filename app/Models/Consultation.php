<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Consultation extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'location',
        'project_type',
        'message',
        'consultation_date',
        'is_published',
    ];

    protected $casts = [
        'is_published'      => 'boolean',
        'consultation_date' => 'date:Y-m-d',
    ];

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_published', false);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('first_name', 'like', "%{$term}%")
              ->orWhere('last_name',  'like', "%{$term}%")
              ->orWhere('email',      'like', "%{$term}%");
        });
    }
}
