<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // We CREATE the bare foundation here
        Schema::create('contact_contents', function (Blueprint $table) {
            $table->id(); // Your second file attaches everything starting after this!
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_contents');
    }
};