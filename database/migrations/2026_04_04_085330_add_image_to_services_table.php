<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // This adds the new image column to your existing table
            $table->string('image')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // This removes the column if you ever need to rollback
            $table->dropColumn('image');
        });
    }
};