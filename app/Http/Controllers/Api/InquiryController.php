<?php

namespace App\Http\Controllers\Api;

use App\Models\Inquiry;
use App\Services\InquiryNormalizer;
use App\Services\GmailSender;
use App\Services\FacebookSender;
use App\Services\ViberSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer,
        private readonly GmailSender       $gmailSender,
        private readonly FacebookSender    $facebookSender,
        private readonly ViberSender       $viberSender,
    ) {}

    // GET /api/inquiries
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

        return response()->json($this->normalizer->fromWebsite($validated), 201);
    }

    // GET /api/inquiries/{id}
    public function show(Inquiry $inquiry): JsonResponse
    {
        return response()->json($inquiry);
    }

    // PUT /api/inquiries/{id}
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
    public function reply(Request $request, Inquiry $inquiry): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        return match ($inquiry->platform) {
            'gmail', 'website' => $this->replyViaGmail($inquiry, $validated['message']),
            'facebook'         => $this->replyViaFacebook($inquiry, $validated['message']),
            'instagram'        => $this->replyViaInstagram($inquiry, $validated['message']),
            'viber'            => $this->replyViaViber($inquiry, $validated['message']),
            default            => response()->json(['error' => 'Reply not supported for this platform.'], 422),
        };
    }

    // ── Platform reply methods ─────────────────────────────────────

    private function replyViaGmail(Inquiry $inquiry, string $message): JsonResponse
    {
        if (!$inquiry->email) {
            return response()->json(['error' => 'No email address found for this inquiry.'], 422);
        }

        $subject = $this->buildSubject($inquiry->message);

        $sent = $this->gmailSender->send(
            toEmail:   $inquiry->email,
            toName:    $inquiry->name ?? $inquiry->email,
            subject:   $subject,
            body:      $message,
            threadId:  $inquiry->raw_payload['threadId']       ?? null,
            inReplyTo: $inquiry->raw_payload['gmailMessageId'] ?? null,
        );

        if (!$sent) {
            return response()->json(['error' => 'Failed to send email. Check Gmail API credentials.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Gmail.', 'inquiry' => $inquiry->fresh()]);
    }

    private function replyViaFacebook(Inquiry $inquiry, string $message): JsonResponse
    {
        $senderId = $inquiry->raw_payload['sender_id'] ?? null;

        if (!$senderId) {
            return response()->json(['error' => 'No Facebook sender ID found.'], 422);
        }

        $sent = $this->facebookSender->send($senderId, $message);

        if (!$sent) {
            return response()->json(['error' => 'Failed to send Facebook message. Check your Page token.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Facebook Messenger.', 'inquiry' => $inquiry->fresh()]);
    }

    private function replyViaInstagram(Inquiry $inquiry, string $message): JsonResponse
    {
        // Instagram uses same API as Facebook — reuse FacebookSender
        $senderId = $inquiry->raw_payload['sender_id'] ?? null;

        if (!$senderId) {
            return response()->json(['error' => 'No Instagram sender ID found.'], 422);
        }

        // Use Instagram page token from DB
        $token = \App\Models\PlatformSetting::getValue('instagram', 'page_token')
              ?? \App\Models\PlatformSetting::getValue('facebook', 'page_access_token');

        if (!$token) {
            return response()->json(['error' => 'Instagram not connected.'], 422);
        }

        $res  = \Illuminate\Support\Facades\Http::post(
            'https://graph.facebook.com/v19.0/me/messages',
            [
                'recipient'      => ['id' => $senderId],
                'message'        => ['text' => $message],
                'messaging_type' => 'RESPONSE',
                'access_token'   => $token,
            ]
        );

        $data = $res->json();

        if (isset($data['error'])) {
            \Illuminate\Support\Facades\Log::error('[RMTY Instagram] Send failed', $data);
            return response()->json(['error' => 'Failed to send Instagram message.'], 500);
        }

        $inquiry->markReplied();
        return response()->json(['message' => 'Reply sent via Instagram.', 'inquiry' => $inquiry->fresh()]);
    }

    private function replyViaViber(Inquiry $inquiry, string $message): JsonResponse
    {
        $senderId = $inquiry->raw_payload['sender_id'] ?? null;
        $name     = $inquiry->name ?? 'User';

        if (!$senderId) {
            return response()->json(['error' => 'No Viber sender ID found.'], 422);
        }

        $sent = $this->viberSender->send($senderId, $name, $message);

        if (!$sent) {
            return response()->json(['error' => 'Failed to send Viber message. Check your bot token.'], 500);
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