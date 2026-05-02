<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'login_attempts')) {
                $table->unsignedTinyInteger('login_attempts')->default(0)->after('otp_expires_at');
            }
            if (! Schema::hasColumn('users', 'locked_until')) {
                $table->timestamp('locked_until')->nullable()->after('login_attempts');
            }
            if (! Schema::hasColumn('users', 'last_reset_request_at')) {
                $table->timestamp('last_reset_request_at')->nullable()->after('locked_until');
            }
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('customer')->after('last_reset_request_at');
            }
        });

        // Backfill: is_admin = 1 → admin, is_admin = 0 → customer
        // Does NOT overwrite super_admin rows
        DB::statement("
            UPDATE users
            SET role = CASE
                WHEN is_admin = 1 THEN 'admin'
                ELSE 'customer'
            END
            WHERE role IS NULL OR role = '' OR role = 'customer'
        ");

        if (! Schema::hasTable('password_histories')) {
            Schema::create('password_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('password');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = ['login_attempts', 'locked_until', 'last_reset_request_at', 'role'];
            $existing = array_filter($cols, fn($c) => Schema::hasColumn('users', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });

        Schema::dropIfExists('password_histories');
    }
};