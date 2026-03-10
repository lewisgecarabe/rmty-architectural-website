<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * RMTY Architectural Website
 * Unified Inquiry System — Migration
 *
 * Run: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();

            // Source platform
            $table->enum('platform', [
                'gmail',
                'facebook',
                'instagram',
                'sms',
                'viber',
                'website',   // for manual/contact-form entries
            ])->index();

            // Platform's own message ID — prevents duplicate inserts
            // when webhooks fire more than once for the same message
            $table->string('external_id')->nullable()->unique();

            // Sender information (varies by platform)
            $table->string('name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone')->nullable()->index();

            // Message content
            $table->text('message');

            // Admin workflow state
            $table->enum('status', ['new', 'replied', 'archived'])
                  ->default('new')
                  ->index();

            // Timestamp when admin marked as replied
            $table->timestamp('replied_at')->nullable();

            // Full original webhook payload — audit trail
            $table->json('raw_payload')->nullable();

            $table->timestamps();

            // Composite index for the most common dashboard query:
            // filtering by platform + status, ordered by created_at
            $table->index(['platform', 'status', 'created_at']);

            // Full-text index for message search
            $table->fullText('message');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};