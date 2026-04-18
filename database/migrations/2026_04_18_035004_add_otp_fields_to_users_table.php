<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // Only add columns that don't exist yet
        if (!Schema::hasColumn('users', 'otp_code')) {
            $table->string('otp_code')->nullable()->after('password');
        }
        if (!Schema::hasColumn('users', 'otp_expires_at')) {
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
        }
        if (!Schema::hasColumn('users', 'first_name')) {
            $table->string('first_name')->nullable()->after('name');
        }
        if (!Schema::hasColumn('users', 'last_name')) {
            $table->string('last_name')->nullable()->after('first_name');
        }
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
