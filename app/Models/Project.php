<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'category_id',
        'location',
        'description',
        'image',
        'is_published'
    ];
     public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
