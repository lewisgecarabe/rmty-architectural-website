<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // ✅ FIX

return new class extends Migration
{
    public function up(): void
    {
        // Add role column if not exists
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('admin')->after('email');
            });
        }

        // Convert old is_admin to role
        if (Schema::hasColumn('users', 'is_admin')) {
            DB::statement("
                UPDATE users 
                SET role = 'admin' 
                WHERE is_admin = 1
            ");
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};