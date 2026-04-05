<?php

namespace App\Http\Controllers\Webhooks;

use App\Models\PlatformSetting;
use App\Services\InquiryNormalizer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MetaWebhookController — routes FB/Instagram messages to correct user
 * File: app/Http/Controllers/Webhooks/MetaWebhookController.php
 */
class MetaWebhookController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer
    ) {}

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

 public function handle(Request $request): Response
{
    if (!$this->verifySignature($request)) {
        Log::warning('[RMTY Meta] Invalid signature');
        return response('Unauthorized', 401);
    }

    Log::info('[META FULL PAYLOAD]', $request->all());

    $body = $request->json()->all();

    foreach ($body['entry'] ?? [] as $entry) {
        $pageId = $entry['id'] ?? null;
        $userId = $pageId ? PlatformSetting::getUserByPageId($pageId) : null;

        foreach ($entry['messaging'] ?? [] as $event) {
            if (!isset($event['message']['text'])) continue;
            if (isset($event['message']['is_echo'])) continue;

            $senderId  = $event['sender']['id'] ?? '';
            $messageId = $event['message']['mid'] ?? uniqid();
            $text      = $event['message']['text'] ?? '';

            $name = $this->getFacebookName($senderId, $userId);

            $this->normalizer->fromFacebook(
                $senderId,
                $messageId,
                $name ?? 'Unknown',
                $text,
                array_merge($event, ['user_id' => $userId]),
                $userId
            );
        }

        foreach ($entry['changes'] ?? [] as $change) {
            if (($change['field'] ?? '') !== 'messages') continue;

            $value = $change['value'] ?? [];

            Log::info('[IG CHANGE]', $change);

            foreach ($value['messages'] ?? [] as $msg) {
                if (!isset($msg['text'])) continue;

                $senderId  = $value['from']['id'] ?? '';
                $messageId = $msg['id'] ?? uniqid();
                $text      = $msg['text'] ?? '';

                $this->normalizer->fromInstagram(
                    $senderId,
                    $messageId,
                    $value['from']['username'] ?? 'Instagram User',
                    $text,
                    array_merge($msg, ['user_id' => $userId]),
                    $userId
                );
            }
        }
    }

    return response('OK', 200);
}
   private function getFacebookName(string $senderId, ?int $userId): ?string
{
    $token = $userId
        ? PlatformSetting::getValue('facebook', 'page_access_token', $userId)
        : null;

    if (!$token) {
        Log::error('[FB NAME] Missing token', ['user_id' => $userId]);
        return null;
    }

    try {
        $res = Http::get("https://graph.facebook.com/v19.0/{$senderId}", [
            'fields'       => 'name',
            'access_token' => $token,
        ]);

        $data = $res->json();

        Log::info('[FB NAME RESPONSE]', $data); // 👈 ADD THIS

        if (isset($data['error'])) {
            Log::error('[FB NAME ERROR]', $data['error']);
            return null;
        }

        return $data['name'] ?? null;

    } catch (\Throwable $e) {
        Log::error('[FB NAME EXCEPTION]', ['error' => $e->getMessage()]);
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