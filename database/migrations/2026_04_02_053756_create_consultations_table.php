<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone', 11);
            $table->string('location');
            $table->string('project_type');
            $table->text('project_details');
            $table->date('consultation_date');
            $table->longText('file_paths')->nullable();
            $table->enum('status', ['pending', 'accepted', 'declined', 'archived'])->default('pending');
            $table->boolean('is_viewed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};