<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Home extends Model
{
    use HasFactory;

    // Tells Laravel to use our specific migration table
    protected $table = 'home_page_contents';

    // Allows mass-assignment for the text fields
    protected $fillable = [
        'hero_title_1',
        'hero_title_2',
        'featured_heading',
        'featured_description',
        'contact_heading',
        'contact_email_label',
        'contact_email',
        'contact_phone_label',
        'contact_phone',
        'contact_address_label',
        'contact_address',
        'contact_cta',
    ];
}