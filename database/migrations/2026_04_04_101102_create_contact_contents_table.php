<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_contents', function (Blueprint $table) {
            // Add new office hours columns
            $table->string('office_day_from')->nullable()->after('address_line_2');
            $table->string('office_day_to')->nullable()->after('office_day_from');
            $table->string('office_time_from')->nullable()->after('office_day_to');
            $table->string('office_time_to')->nullable()->after('office_time_from');
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