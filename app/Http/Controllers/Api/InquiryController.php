<?php

namespace App\Http\Controllers\Api;

use App\Models\Inquiry;
use App\Services\InquiryNormalizer;
use App\Services\GmailSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * InquiryController
 * File: app/Http/Controllers/Api/InquiryController.php
 */
class InquiryController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer,
        private readonly GmailSender $gmailSender
    ) {}

    // ─── GET /api/inquiries ────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Inquiry::query()->latest('created_at');

        if ($platform = $request->query('platform')) {
            $query->forPlatform($platform);
        }
        if ($status = $request->query('status')) {
            $query->withStatus($status);
        }
        if ($search = $request->query('search')) {
            $query->search($search);
        }

        $inquiries = $query->paginate((int) $request->query('per_page', 20));
        return response()->json($inquiries);
    }

    // ─── POST /api/inquiries ───────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'nullable|string|max:255',
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'message' => 'required|string|max:5000',
        ]);

        $inquiry = $this->normalizer->fromWebsite($validated);
        return response()->json($inquiry, 201);
    }

    // ─── GET /api/inquiries/{id} ───────────────────────────────────
    public function show(Inquiry $inquiry): JsonResponse
    {
        return response()->json($inquiry);
    }

    // ─── PUT /api/inquiries/{id} ───────────────────────────────────
    public function update(Request $request, Inquiry $inquiry): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:new,replied,archived',
        ]);

        match ($validated['status']) {
            'replied'  => $inquiry->markReplied(),
            'archived' => $inquiry->markArchived(),
            'new'      => $inquiry->markNew(),
        };

        return response()->json($inquiry->fresh());
    }

    // ─── DELETE /api/inquiries/{id} ────────────────────────────────
    public function destroy(Inquiry $inquiry): JsonResponse
    {
        $inquiry->delete();
        return response()->json(['message' => 'Inquiry deleted.']);
    }

    // ─── GET /api/inquiries/stats ──────────────────────────────────
    public function stats(): JsonResponse
    {
        return response()->json([
            'total'       => Inquiry::count(),
            'new'         => Inquiry::withStatus('new')->count(),
            'replied'     => Inquiry::withStatus('replied')->count(),
            'archived'    => Inquiry::withStatus('archived')->count(),
            'by_platform' => Inquiry::selectRaw('platform, COUNT(*) as count')
                                    ->groupBy('platform')
                                    ->pluck('count', 'platform'),
        ]);
    }

    // ─── POST /api/inquiries/{id}/reply ───────────────────────────
    /**
     * Send a reply email via Gmail and mark the inquiry as replied.
     *
     * Only works for inquiries that have an email address.
     * For SMS/Viber/Facebook inquiries without email, returns 422.
     *
     * Body: { "message": "Your reply text here" }
     */
    public function reply(Request $request, Inquiry $inquiry): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        // Must have an email to reply to
        if (!$inquiry->email) {
            return response()->json([
                'error' => 'This inquiry has no email address to reply to.',
            ], 422);
        }

        // Build subject — prefix with Re: if not already there
        $originalSubject = $this->extractSubject($inquiry->message);
        $subject = str_starts_with(strtolower($originalSubject), 're:')
            ? $originalSubject
            : 'Re: ' . $originalSubject;

        // Get Gmail thread data from raw_payload
        // threadId   → keeps reply in the same Gmail thread
        // inReplyTo  → RFC 2822 Message-ID, tells email clients this is a reply
        $threadId  = $inquiry->raw_payload['threadId']       ?? null;
        $inReplyTo = $inquiry->raw_payload['gmailMessageId'] ?? null;

        // Send via Gmail API
        $sent = $this->gmailSender->send(
            toEmail:   $inquiry->email,
            toName:    $inquiry->name ?? $inquiry->email,
            subject:   $subject,
            body:      $validated['message'],
            threadId:  $threadId,
            inReplyTo: $inReplyTo
        );

        if (!$sent) {
            return response()->json([
                'error' => 'Failed to send email. Check your Gmail API credentials.',
            ], 500);
        }

        // Mark inquiry as replied
        $inquiry->markReplied();

        return response()->json([
            'message' => 'Reply sent successfully.',
            'inquiry' => $inquiry->fresh(),
        ]);
    }

    /**
     * Extract a clean subject from the stored message.
     * Gmail messages are stored as "Subject: ...\n\nBody"
     */
    private function extractSubject(string $message): string
    {
        if (str_starts_with($message, 'Subject:')) {
            $lines = explode("\n", $message);
            $subjectLine = $lines[0] ?? '';
            return trim(str_replace('Subject:', '', $subjectLine)) ?: 'Your Inquiry';
        }
        return 'Your Inquiry';
    }
}