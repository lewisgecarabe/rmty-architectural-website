<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       Schema::create('contact_contents', function (Blueprint $table) {
    $table->id();

    $table->string('page_heading')->nullable();
    $table->text('page_description')->nullable();

    $table->string('location_label')->nullable();
    $table->string('address_line_1')->nullable();
    $table->string('address_line_2')->nullable();

    $table->string('office_day_from')->nullable();
    $table->string('office_day_to')->nullable();
    $table->string('office_time_from')->nullable();
    $table->string('office_time_to')->nullable();

    $table->string('phone')->nullable();
    $table->string('email')->nullable();

    $table->string('hero_image')->nullable();

    $table->timestamps();
});

    }

    public function down(): void
    {
        Schema::table('contact_contents', function (Blueprint $table) {
            $table->dropColumn([
                'office_day_from',
                'office_day_to',
                'office_time_from',
                'office_time_to',
            ]);
        });
    }
};