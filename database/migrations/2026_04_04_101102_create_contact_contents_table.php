<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
<<<<<<< HEAD
        Schema::create('contact_contents', function (Blueprint $table) {
    $table->id();
    $table->string('address_line_1')->nullable();
    $table->string('address_line_2')->nullable();
    $table->string('office_day_from')->nullable();
    $table->string('office_day_to')->nullable();
    $table->string('office_hours')->nullable();
    $table->timestamps();
});
=======
        // We CREATE the bare foundation here
        Schema::create('contact_contents', function (Blueprint $table) {
            $table->id(); // Your second file attaches everything starting after this!
            $table->timestamps();
        });
>>>>>>> 3d0116b587f8298d366d25d398840383b899bf72
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_contents');
    }
};