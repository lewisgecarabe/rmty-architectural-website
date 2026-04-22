<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    private function defaultFaqs(): array
    {
        return [
            [
                'category' => 'Scope',
                'question' => 'What types of projects does RMTY handle?',
                'answer' => 'RMTY handles residential, commercial, interior architecture, and planning-focused projects. We tailor each design to the client\'s goals, budget, and site conditions.',
                'is_published' => true,
                'sort_order' => 0,
            ],
            [
                'category' => 'Getting Started',
                'question' => 'How do I start a project with RMTY?',
                'answer' => 'You can start by sending an inquiry through the Contact page or booking a consultation through the Appointment page. We then schedule a discussion to understand your requirements.',
                'is_published' => true,
                'sort_order' => 1,
            ],
            [
                'category' => 'Process',
                'question' => 'Do you offer full design-to-construction support?',
                'answer' => 'Yes. RMTY can support your project from concept development and design documentation up to construction coordination, depending on your selected scope.',
                'is_published' => true,
                'sort_order' => 2,
            ],
            [
                'category' => 'Timeline',
                'question' => 'How long does a typical design process take?',
                'answer' => 'Timelines vary by project size and complexity. Smaller residential work can move faster, while larger or multi-phase projects require longer planning and approvals.',
                'is_published' => true,
                'sort_order' => 3,
            ],
            [
                'category' => 'Process',
                'question' => 'Can I request revisions during the design process?',
                'answer' => 'Yes. Revisions are part of the process. We align design options with your feedback while maintaining technical and planning feasibility.',
                'is_published' => true,
                'sort_order' => 4,
            ],
            [
                'category' => 'Consultation',
                'question' => 'How are consultations scheduled?',
                'answer' => 'Consultations are scheduled through the Appointment page. Once submitted, our team confirms your preferred schedule through email or phone.',
                'is_published' => true,
                'sort_order' => 5,
            ],
        ];
    }

    private function ensureDefaultFaqs(): void
    {
        if (Faq::count() > 0) {
            return;
        }

        foreach ($this->defaultFaqs() as $faq) {
            Faq::create($faq);
        }
    }

    public function index()
    {
        $this->ensureDefaultFaqs();

        return Faq::where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function adminIndex()
    {
        $this->ensureDefaultFaqs();

        return Faq::orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $maxSort = Faq::max('sort_order');

        $data = $request->validate([
            'category' => 'nullable|string|max:255',
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $data['category'] = trim((string) ($data['category'] ?? 'General'));
        $data['question'] = trim((string) $data['question']);
        $data['answer'] = trim((string) $data['answer']);
        $data['is_published'] = $data['is_published'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? (is_null($maxSort) ? 0 : $maxSort + 1);

        $faq = Faq::create($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'subject_type' => 'faq',
                'subject_id' => $faq->id,
                'subject_title' => $faq->question,
            ]);
        }

        return response()->json($faq, 201);
    }

    public function update(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $data = $request->validate([
            'category' => 'nullable|string|max:255',
            'question' => 'sometimes|required|string|max:255',
            'answer' => 'sometimes|required|string',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        if (array_key_exists('category', $data)) {
            $data['category'] = trim((string) ($data['category'] ?? 'General'));
        }

        if (array_key_exists('question', $data)) {
            $data['question'] = trim((string) $data['question']);
        }

        if (array_key_exists('answer', $data)) {
            $data['answer'] = trim((string) $data['answer']);
        }

        $oldQuestion = $faq->question;
        $faq->update($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'subject_type' => 'faq',
                'subject_id' => $faq->id,
                'subject_title' => $faq->question ?: $oldQuestion,
            ]);
        }

        return response()->json($faq);
    }

    public function destroy(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);
        $question = $faq->question;

        $faq->delete();

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'deleted',
                'subject_type' => 'faq',
                'subject_id' => (int) $id,
                'subject_title' => $question,
            ]);
        }

        return response()->json(['message' => 'Deleted']);
    }
}
