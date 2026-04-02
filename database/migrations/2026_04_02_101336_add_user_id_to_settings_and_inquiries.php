<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: add user_id to google_settings, platform_settings, inquiries
 * File: database/migrations/2024_01_01_000004_add_user_id_to_settings_and_inquiries.php
 */
return new class extends Migration
{
    public function up(): void
    {
        // Add user_id to google_settings
        Schema::table('google_settings', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->index('user_id');
            // Drop old unique on key alone, add unique on user_id+key
            $table->dropUnique(['key']);
            $table->unique(['user_id', 'key']);
        });

        // Add user_id to platform_settings
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->index('user_id');
            // Drop old unique on platform+key, add unique on user_id+platform+key
            $table->dropUnique(['platform', 'key']);
            $table->unique(['user_id', 'platform', 'key']);
        });

        // Add user_id to inquiries
        Schema::table('inquiries', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('google_settings', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'key']);
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
            $table->unique(['key']);
        });

        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'platform', 'key']);
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
            $table->unique(['platform', 'key']);
        });

        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};