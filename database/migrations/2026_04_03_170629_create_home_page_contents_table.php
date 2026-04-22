<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_page_contents', function (Blueprint $table) {
            $table->id();
            
            // Hero Section
            $table->string('hero_title_1')->default('RMTY Designs');
            $table->string('hero_title_2')->default('Studio');
            $table->string('hero_image_1')->nullable();
            $table->string('hero_image_2')->nullable();
            $table->string('hero_image_3')->nullable();
            
            // Featured Projects Section
            $table->string('featured_heading')->default('Design With Purpose');
            $table->text('featured_description')->nullable();
            
            // Contact Section
            $table->string('contact_heading')->default('Contact Us.');
            $table->string('contact_email_label')->default('Email');
            $table->string('contact_email')->default('rmty.architects@gmail.com');
            $table->string('contact_phone_label')->default('Phone');
            $table->string('contact_phone')->default('0915 896 2275');
            $table->string('contact_address_label')->default('Address');
            $table->text('contact_address')->nullable();
            $table->string('contact_image')->nullable();
            $table->string('contact_cta')->default('Let’s Talk!');
            
            $table->timestamps();
        });

        // Insert default row immediately so the frontend always has data to fetch
        DB::table('home_page_contents')->insert([
            'featured_description' => 'RMTY approaches each project with a balance of architectural clarity and practical execution. Our featured works demonstrate how we translate site context, client goals, and technical requirements into spaces that are purposeful and enduring.',
            'contact_address' => "911 Josefina 2 Sampaloc, Manila,\nPhilippines",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('home_page_contents');
    }
};