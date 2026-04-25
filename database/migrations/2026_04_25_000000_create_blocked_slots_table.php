<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocked_slots', function (Blueprint $table) {
            $table->id();
            $table->date('blocked_date')->index();
            $table->string('blocked_time', 5); // e.g. "09:00"
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['blocked_date', 'blocked_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocked_slots');
    }
};
