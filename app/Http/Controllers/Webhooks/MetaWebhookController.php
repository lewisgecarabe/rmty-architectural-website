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

    $body   = $request->json()->all();
    $object = $body['object'] ?? '';

    foreach ($body['entry'] ?? [] as $entry) {
        // FACEBOOK MESSAGES
        if ($object === 'page') {
            $pageId = $entry['id'] ?? null;
            $setting = $pageId ? PlatformSetting::findUserByPageId($pageId) : null;
            $userId  = $setting?->user_id;

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
                    $name,
                    $text,
                    array_merge($event, ['user_id' => $userId]),
                    $userId
                );
            }
        }

        // INSTAGRAM MESSAGES
        if ($object === 'instagram') {
            foreach ($entry['changes'] ?? [] as $change) {
                $value = $change['value'] ?? [];

                // Instagram message payloads usually arrive here
                if (($value['field'] ?? '') !== 'messages') continue;
                if (isset($value['message']['is_echo'])) continue;
                if (!isset($value['message']['text']) && !isset($value['message'])) continue;

                $pageId = $value['metadata']['page_id'] ?? ($entry['id'] ?? null);
                $setting = $pageId ? PlatformSetting::findUserByPageId($pageId) : null;
                $userId  = $setting?->user_id;

                $senderId  = $value['sender']['id'] ?? '';
                $messageId = $value['message']['mid'] ?? uniqid();
                $text      = $value['message']['text'] ?? '';

                $this->normalizer->fromInstagram(
                    $senderId,
                    $messageId,
                    $value['sender']['username'] ?? null,
                    $text,
                    array_merge($value, ['user_id' => $userId]),
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