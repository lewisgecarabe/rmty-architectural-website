<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'location',
        'project_type',
        'project_details',
        'consultation_date',
        'file_paths',
        'status',
        'is_viewed',
    ];

    protected $casts = [
        'file_paths'        => 'array',
        'consultation_date' => 'date',
        'is_viewed'         => 'boolean',
    ];
}