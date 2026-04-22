<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('category')->default('General');
            $table->string('question');
            $table->text('answer');
            $table->boolean('is_published')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('faqs')->insert([
            [
                'category' => 'Scope',
                'question' => 'What types of projects does RMTY handle?',
                'answer' => 'RMTY handles residential, commercial, interior architecture, and planning-focused projects. We tailor each design to the client\'s goals, budget, and site conditions.',
                'is_published' => true,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'Getting Started',
                'question' => 'How do I start a project with RMTY?',
                'answer' => 'You can start by sending an inquiry through the Contact page or booking a consultation through the Appointment page. We then schedule a discussion to understand your requirements.',
                'is_published' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'Process',
                'question' => 'Do you offer full design-to-construction support?',
                'answer' => 'Yes. RMTY can support your project from concept development and design documentation up to construction coordination, depending on your selected scope.',
                'is_published' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'Timeline',
                'question' => 'How long does a typical design process take?',
                'answer' => 'Timelines vary by project size and complexity. Smaller residential work can move faster, while larger or multi-phase projects require longer planning and approvals.',
                'is_published' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'Process',
                'question' => 'Can I request revisions during the design process?',
                'answer' => 'Yes. Revisions are part of the process. We align design options with your feedback while maintaining technical and planning feasibility.',
                'is_published' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'Consultation',
                'question' => 'How are consultations scheduled?',
                'answer' => 'Consultations are scheduled through the Appointment page. Once submitted, our team confirms your preferred schedule through email or phone.',
                'is_published' => true,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
