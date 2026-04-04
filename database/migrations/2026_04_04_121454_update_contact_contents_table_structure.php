<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_contents', function (Blueprint $table) {
            // Check if old columns exist and drop them
            if (Schema::hasColumn('contact_contents', 'office_hours')) {
                $table->dropColumn('office_hours');
            }
            if (Schema::hasColumn('contact_contents', 'email_label')) {
                $table->dropColumn('email_label');
            }
            
            // Add new columns if they don't exist
            if (!Schema::hasColumn('contact_contents', 'office_day_from')) {
                $table->string('office_day_from')->nullable()->after('address_line_2');
            }
            if (!Schema::hasColumn('contact_contents', 'office_day_to')) {
                $table->string('office_day_to')->nullable()->after('office_day_from');
            }
            if (!Schema::hasColumn('contact_contents', 'office_time_from')) {
                $table->string('office_time_from')->nullable()->after('office_day_to');
            }
            if (!Schema::hasColumn('contact_contents', 'office_time_to')) {
                $table->string('office_time_to')->nullable()->after('office_time_from');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contact_contents', function (Blueprint $table) {
            // Restore old columns
            if (!Schema::hasColumn('contact_contents', 'office_hours')) {
                $table->string('office_hours')->nullable();
            }
            if (!Schema::hasColumn('contact_contents', 'email_label')) {
                $table->string('email_label')->nullable();
            }
            
            // Remove new columns
            if (Schema::hasColumn('contact_contents', 'office_day_from')) {
                $table->dropColumn('office_day_from');
            }
            if (Schema::hasColumn('contact_contents', 'office_day_to')) {
                $table->dropColumn('office_day_to');
            }
            if (Schema::hasColumn('contact_contents', 'office_time_from')) {
                $table->dropColumn('office_time_from');
            }
            if (Schema::hasColumn('contact_contents', 'office_time_to')) {
                $table->dropColumn('office_time_to');
            }
        });
    }
};