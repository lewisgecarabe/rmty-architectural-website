<?php

namespace App\Http\Controllers\Webhooks;

use App\Models\PlatformSetting;
use App\Services\InquiryNormalizer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaWebhookController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer
    ) {}

    // GET /api/webhooks/meta — Meta verification handshake
    public function verify(Request $request): Response
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === config('services.meta.verify_token')) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    // POST /api/webhooks/meta — Incoming Facebook + Instagram messages
    public function handle(Request $request): Response
    {
        if (!$this->verifySignature($request)) {
            Log::warning('[RMTY Meta] Invalid signature');
            return response('Unauthorized', 401);
        }

        $body   = $request->json()->all();
        $object = $body['object'] ?? '';

        foreach ($body['entry'] ?? [] as $entry) {
            foreach ($entry['messaging'] ?? [] as $event) {
                // Skip non-text events (read receipts, typing indicators)
                if (!isset($event['message']['text'])) continue;
                // Skip messages sent by the page itself
                if (isset($event['message']['is_echo'])) continue;

                $senderId  = $event['sender']['id']    ?? '';
                $messageId = $event['message']['mid']  ?? uniqid();
                $text      = $event['message']['text'] ?? '';

                if ($object === 'page') {
                    $name = $this->getFacebookName($senderId);
                    $this->normalizer->fromFacebook($senderId, $messageId, $name, $text, $event);
                } elseif ($object === 'instagram') {
                    $this->normalizer->fromInstagram($senderId, $messageId, null, $text, $event);
                }
            }
        }

        return response('OK', 200);
    }

    private function getFacebookName(string $senderId): ?string
    {
        $token = PlatformSetting::getValue('facebook', 'page_access_token')
              ?? config('services.meta.page_access_token');

        if (!$token) return null;

        try {
            $res = Http::get("https://graph.facebook.com/{$senderId}", [
                'fields'       => 'name',
                'access_token' => $token,
            ]);
            return $res->json()['name'] ?? null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function verifySignature(Request $request): bool
    {
        if (app()->environment('local', 'testing')) return true;

        $signature = $request->header('X-Hub-Signature-256', '');
        $expected  = 'sha256=' . hash_hmac('sha256', $request->getContent(), config('services.meta.app_secret'));

        return hash_equals($expected, $signature);
    }
}