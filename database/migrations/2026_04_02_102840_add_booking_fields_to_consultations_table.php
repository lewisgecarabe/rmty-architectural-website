<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (!Schema::hasColumn('consultations', 'status')) {
                $table->string('status')->default('pending')->after('consultation_date');
            }

            if (!Schema::hasColumn('consultations', 'reschedule_reason')) {
                $table->text('reschedule_reason')->nullable()->after('status');
            }

            if (!Schema::hasColumn('consultations', 'is_published')) {
                $table->boolean('is_published')->default(true)->after('reschedule_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (Schema::hasColumn('consultations', 'status')) {
                $table->dropColumn('status');
            }

            if (Schema::hasColumn('consultations', 'reschedule_reason')) {
                $table->dropColumn('reschedule_reason');
            }

            if (Schema::hasColumn('consultations', 'is_published')) {
                $table->dropColumn('is_published');
            }
        });
    }
};