<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ── consultations ────────────────────────────────────────────────
        Schema::table('consultations', function (Blueprint $table) {
            $table->string('reference_id', 24)->nullable()->unique()->after('id');
        });

        // ── inquiries ────────────────────────────────────────────────────
        Schema::table('inquiries', function (Blueprint $table) {
            $table->string('reference_id', 24)->nullable()->unique()->after('id');
        });

        // ── Back-fill existing rows ───────────────────────────────────────
        // Consultations
        DB::table('consultations')
            ->whereNull('reference_id')
            ->orderBy('id')
            ->each(function ($row) {
                $date   = date('Ymd', strtotime($row->created_at));
                $suffix = str_pad($row->id, 4, '0', STR_PAD_LEFT);
                DB::table('consultations')
                    ->where('id', $row->id)
                    ->update(['reference_id' => "APT-{$date}-{$suffix}"]);
            });

        // Inquiries
        DB::table('inquiries')
            ->whereNull('reference_id')
            ->orderBy('id')
            ->each(function ($row) {
                $date   = date('Ymd', strtotime($row->created_at));
                $suffix = str_pad($row->id, 4, '0', STR_PAD_LEFT);
                DB::table('inquiries')
                    ->where('id', $row->id)
                    ->update(['reference_id' => "INQ-{$date}-{$suffix}"]);
            });

        // ── Make non-nullable now that all rows have a value ─────────────
        Schema::table('consultations', function (Blueprint $table) {
            $table->string('reference_id', 24)->nullable(false)->change();
        });

        Schema::table('inquiries', function (Blueprint $table) {
            $table->string('reference_id', 24)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn('reference_id');
        });

        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropColumn('reference_id');
        });
    }
};