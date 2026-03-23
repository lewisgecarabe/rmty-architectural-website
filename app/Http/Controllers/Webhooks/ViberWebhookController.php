<?php

namespace App\Http\Controllers\Webhooks;

use App\Models\PlatformSetting;
use App\Services\InquiryNormalizer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class ViberWebhookController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer
    ) {}

    // POST /api/webhooks/viber
    public function handle(Request $request): Response
    {
        if (!$this->verifySignature($request)) {
            Log::warning('[RMTY Viber] Invalid signature');
            return response('Unauthorized', 401);
        }

        $body      = $request->json()->all();
        $eventType = $body['event'] ?? '';

        Log::info('[RMTY Viber] Event', ['type' => $eventType]);

        if ($eventType === 'message' && ($body['message']['type'] ?? '') === 'text') {
            $senderId  = $body['sender']['id']           ?? uniqid('viber_');
            $messageId = (string)($body['message_token'] ?? uniqid('viber_msg_'));
            $name      = $body['sender']['name']         ?? null;
            $text      = $body['message']['text']        ?? '';

            $this->normalizer->fromViber($senderId, $messageId, $name, $text, $body);
        }

        return response('OK', 200);
    }

    private function verifySignature(Request $request): bool
    {
        if (app()->environment('local', 'testing')) return true;

        $token = PlatformSetting::getValue('viber', 'token')
              ?? config('services.viber.token');

        if (!$token) return false;

        $signature = $request->header('X-Viber-Content-Signature', '');
        $expected  = hash_hmac('sha256', $request->getContent(), $token);

        return hash_equals($expected, $signature);
    }
}