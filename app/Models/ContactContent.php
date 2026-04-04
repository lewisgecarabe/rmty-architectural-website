<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactContent extends Model
{
    protected $fillable = [
        'page_heading',
        'page_description',
        'location_label',
        'address_line_1',
        'address_line_2',
        'office_day_from',
        'office_day_to',
        'office_time_from',
        'office_time_to',
        'phone',
        'email',
        'hero_image',
    ];
}