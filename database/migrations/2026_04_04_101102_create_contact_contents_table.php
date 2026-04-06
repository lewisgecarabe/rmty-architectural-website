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
    $table->string('address_line_1')->nullable();
    $table->string('address_line_2')->nullable();
    $table->string('office_day_from')->nullable();
    $table->string('office_day_to')->nullable();
    $table->string('office_hours')->nullable();
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