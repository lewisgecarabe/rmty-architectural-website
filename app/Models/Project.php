<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Project extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'category_id',
        'location',
        'description',
        'image',
        'is_published',
    ];

    protected $appends = ['cover_image', 'gallery_images'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProjectImage::class)->orderBy('sort_order');
    }

    public function getCoverImageAttribute(): ?string
    {
        return $this->image
            ? Storage::url($this->image)
            : null;
    }

    public function getGalleryImagesAttribute(): array
    {
        return $this->images
            ->map(fn($img) => Storage::url($img->image_path))
            ->toArray();
    }
}