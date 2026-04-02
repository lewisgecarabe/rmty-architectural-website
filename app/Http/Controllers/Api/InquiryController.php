<?php

namespace App\Http\Controllers\Api;

use App\Models\Inquiry;
use App\Services\InquiryNormalizer;
use App\Services\GmailSender;
use App\Services\FacebookSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * InquiryController — all users see all inquiries, reply via own account
 * File: app/Http/Controllers/Api/InquiryController.php
 */
class InquiryController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer,
        private readonly GmailSender       $gmailSender,
        private readonly FacebookSender    $facebookSender,
    ) {}

    // GET /api/inquiries — all users see ALL inquiries
    public function index(Request $request): JsonResponse
    {
        $query = Inquiry::query()->latest('created_at');

        if ($platform = $request->query('platform')) $query->forPlatform($platform);
        if ($status   = $request->query('status'))   $query->withStatus($status);
        if ($search   = $request->query('search'))   $query->search($search);

        return response()->json($query->paginate((int) $request->query('per_page', 20)));
    }

    // POST /api/inquiries
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'nullable|string|max:255',
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'message' => 'required|string|max:5000',
        ]);

        return response()->json(
            $this->normalizer->fromWebsite($validated, auth()->id()),
            201
        );
    }

    // GET /api/inquiries/{id}
    public function show(Inquiry $inquiry): JsonResponse
    {
        return response()->json($inquiry);
    }

    // PUT /api/inquiries/{id}
    public function update(Request $request, Inquiry $inquiry): JsonResponse
    {
        $validated = $request->validate(['status' => 'required|in:new,replied,archived']);

        match ($validated['status']) {
            'replied'  => $inquiry->markReplied(),
            'archived' => $inquiry->markArchived(),
            'new'      => $inquiry->markNew(),
        };

        return response()->json($inquiry->fresh());
    }

    // DELETE /api/inquiries/{id}
    public function destroy(Inquiry $inquiry): JsonResponse
    {
        $inquiry->delete();
        return response()->json(['message' => 'Inquiry deleted.']);
    }

    // GET /api/inquiries/stats
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

    // POST /api/inquiries/{id}/reply
    // Each user replies using their own connected platform account
    public function reply(Request $request, Inquiry $inquiry): JsonResponse
    {
        $validated = $request->validate(['message' => 'required|string|max:5000']);
        $userId    = auth()->id();

        return match ($inquiry->platform) {
            'gmail', 'website' => $this->replyViaGmail($inquiry, $validated['message'], $userId),
            'facebook'         => $this->replyViaFacebook($inquiry, $validated['message'], $userId),
            'instagram'        => $this->replyViaInstagram($inquiry, $validated['message'], $userId),
            default            => response()->json(['error' => 'Reply not supported for this platform.'], 422),
        };
    }

    private function replyViaGmail(Inquiry $inquiry, string $message, int $userId): JsonResponse
    {
        if (!$inquiry->email) {
            return response()->json(['error' => 'No email address found.'], 422);
        }

        $subject = $this->buildSubject($inquiry->message);

        $sent = $this->gmailSender->send(
            toEmail:   $inquiry->email,
            toName:    $inquiry->name ?? $inquiry->email,
            subject:   $subject,
            body:      $message,
            threadId:  $inquiry->raw_payload['threadId']       ?? null,
            inReplyTo: $inquiry->raw_payload['gmailMessageId'] ?? null,
            userId:    $userId
        );

        if (!$sent) {
            return response()->json(['error' => 'Failed to send. Make sure Gmail is connected in your settings.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Gmail.', 'inquiry' => $inquiry->fresh()]);
    }

    private function replyViaFacebook(Inquiry $inquiry, string $message, int $userId): JsonResponse
    {
        $senderId = $inquiry->raw_payload['sender_id'] ?? null;

        if (!$senderId) {
            return response()->json(['error' => 'No Facebook sender ID found.'], 422);
        }

        $sent = $this->facebookSender->send($senderId, $message, $userId);

        if (!$sent) {
            return response()->json(['error' => 'Failed to send. Make sure Facebook is connected in your settings.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Facebook.', 'inquiry' => $inquiry->fresh()]);
    }

    private function replyViaInstagram(Inquiry $inquiry, string $message, int $userId): JsonResponse
    {
        $senderId = $inquiry->raw_payload['sender_id'] ?? null;

        if (!$senderId) {
            return response()->json(['error' => 'No Instagram sender ID found.'], 422);
        }

        $token = \App\Models\PlatformSetting::getValue('instagram', 'page_token', $userId)
              ?? \App\Models\PlatformSetting::getValue('facebook', 'page_access_token', $userId);

        if (!$token) {
            return response()->json(['error' => 'Instagram not connected in your settings.'], 422);
        }

        $res  = Http::post('https://graph.facebook.com/v19.0/me/messages', [
            'recipient'      => ['id' => $senderId],
            'message'        => ['text' => $message],
            'messaging_type' => 'RESPONSE',
            'access_token'   => $token,
        ]);

        if (isset($res->json()['error'])) {
            return response()->json(['error' => 'Failed to send Instagram reply.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Instagram.', 'inquiry' => $inquiry->fresh()]);
    }

    private function replyViaViber(Inquiry $inquiry, string $message, int $userId): JsonResponse
    {
        $senderId = $inquiry->raw_payload['sender_id'] ?? null;
        $name     = $inquiry->name ?? 'User';

        if (!$senderId) {
            return response()->json(['error' => 'No Viber sender ID found.'], 422);
        }

        $sent = $this->viberSender->send($senderId, $name, $message);

        if (!$sent) {
            return response()->json(['error' => 'Failed to send Viber reply.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Viber.', 'inquiry' => $inquiry->fresh()]);
    }

    private function buildSubject(string $message): string
    {
        if (str_starts_with($message, 'Subject:')) {
            $subject = trim(str_replace('Subject:', '', explode("\n", $message)[0]));
            return str_starts_with(strtolower($subject), 're:') ? $subject : 'Re: ' . $subject;
        }
        return 'Re: Your Inquiry';
    }
}