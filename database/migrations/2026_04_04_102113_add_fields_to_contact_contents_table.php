<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_contents', function (Blueprint $table) {
            $table->string('page_heading')->nullable()->after('id');
            $table->text('page_description')->nullable()->after('page_heading');

            $table->string('location_label')->nullable()->after('page_description');
            $table->string('address_line_1')->nullable()->after('location_label');
            $table->string('address_line_2')->nullable()->after('address_line_1');

            // Changed from office_hours to separate day/time fields
            $table->string('office_day_from')->nullable()->after('address_line_2');
            $table->string('office_day_to')->nullable()->after('office_day_from');
            $table->string('office_time_from')->nullable()->after('office_day_to');
            $table->string('office_time_to')->nullable()->after('office_time_from');
            
            $table->string('phone')->nullable()->after('office_time_to');

            // Removed email_label, kept only email
            $table->string('email')->nullable()->after('phone');

            $table->string('hero_image')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('contact_contents', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};