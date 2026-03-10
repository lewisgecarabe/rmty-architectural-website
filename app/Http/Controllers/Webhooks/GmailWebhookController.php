<?php

namespace App\Http\Controllers\Webhooks;

use App\Models\Inquiry;
use App\Services\InquiryNormalizer;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * GmailWebhookController
 * File: app/Http/Controllers/Webhooks/GmailWebhookController.php
 *
 * HOW GMAIL PUSH WORKS:
 * 1. You call Gmail API users.watch() — subscribes your inbox to Pub/Sub.
 * 2. When a new email arrives, Google posts a notification to this endpoint.
 * 3. The POST contains base64-encoded metadata (NOT the email itself).
 * 4. This controller decodes the notification and fetches the full email
 *    via Gmail API, then stores it via InquiryNormalizer.
 *
 * SETUP (one-time):
 *   1. Enable Gmail API + Cloud Pub/Sub in Google Cloud Console.
 *   2. Create Pub/Sub topic, add gmail-api-push@system.gserviceaccount.com
 *      as Publisher.
 *   3. Create Push Subscription pointing to: APP_URL/api/webhooks/gmail
 *   4. Fill GOOGLE_* vars in .env
 *   5. Run: php artisan tinker
 *      >>> app(App\Http\Controllers\Webhooks\GmailWebhookController::class)->setupWatch()
 *
 * composer require google/apiclient
 */
class GmailWebhookController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer
    ) {}

    /**
     * POST /api/webhooks/gmail
     * Receives Google Pub/Sub push notification.
     */
    public function handle(Request $request): Response
    {
        $payload = $request->json()->all();

        if (empty($payload['message'])) {
            return response('No message payload', 400);
        }

        // Decode Pub/Sub data envelope
        $data = json_decode(
            base64_decode($payload['message']['data'] ?? ''),
            true
        );

        Log::info('[RMTY Inquiry] Gmail Pub/Sub notification', ['data' => $data]);

        // Fetch actual email content from Gmail API
        $this->fetchAndStore(
            emailAddress:  $data['emailAddress'] ?? '',
            pubsubMsgId:   $payload['message']['messageId'] ?? null
        );

        // ALWAYS return 200 — non-200 causes Pub/Sub to retry
        return response('OK', 200);
    }

    private function fetchAndStore(string $emailAddress, ?string $pubsubMsgId): void
    {
        try {
            $client = $this->buildGoogleClient();
            $gmail  = new Gmail($client);

            // Fetch latest unread messages from inbox
            $list = $gmail->users_messages->listUsersMessages('me', [
                'q'          => 'is:unread in:inbox',
                'maxResults' => 10,
            ]);

            foreach ($list->getMessages() ?? [] as $ref) {
                // Skip if already stored
                if (Inquiry::where('external_id', $ref->getId())->exists()) {
                    continue;
                }

                $full = $gmail->users_messages->get('me', $ref->getId(), [
                    'format' => 'full',
                ]);

                $headers = collect($full->getPayload()->getHeaders())
                    ->keyBy('name');

                $from    = $headers->get('From')?->getValue() ?? '';
                $subject = $headers->get('Subject')?->getValue() ?? '(No subject)';
                $body    = $this->extractBody($full->getPayload());

                // Store Message-ID header — needed for In-Reply-To threading
                $gmailMessageId = $headers->get('Message-ID')?->getValue()
                               ?? $headers->get('Message-Id')?->getValue()
                               ?? null;

                $this->normalizer->fromGmail(
                    messageId:  $ref->getId(),
                    from:       $from,
                    subject:    $subject,
                    body:       $body,
                    rawPayload: [
                        'messageId'      => $ref->getId(),
                        'threadId'       => $full->getThreadId(),
                        'gmailMessageId' => $gmailMessageId, // RFC 2822 Message-ID for threading
                        'from'           => $from,
                        'subject'        => $subject,
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::error('[RMTY Inquiry] Gmail fetch error', [
                'error'   => $e->getMessage(),
                'address' => $emailAddress,
            ]);
        }
    }

    private function extractBody(\Google\Service\Gmail\MessagePart $part): string
    {
        // Try to get text/plain part first
        foreach ($part->getParts() ?? [] as $subpart) {
            if ($subpart->getMimeType() === 'text/plain') {
                $data = $subpart->getBody()->getData();
                return base64_decode(strtr($data, '-_', '+/'));
            }
        }
        // Single-part fallback
        $data = $part->getBody()?->getData();
        return $data ? base64_decode(strtr($data, '-_', '+/')) : '';
    }

    private function buildGoogleClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_READONLY);
        $client->setAccessType('offline');

        // Always fetch a fresh access token using the refresh token.
        // GOOGLE_ACCESS_TOKEN is NOT needed in .env — it expires in 1 hour anyway.
        // Only GOOGLE_REFRESH_TOKEN is required.
        $newToken = $client->fetchAccessTokenWithRefreshToken(
            config('services.google.refresh_token')
        );

        if (isset($newToken['error'])) {
            throw new \RuntimeException(
                'Gmail token refresh failed: ' . $newToken['error'] .
                ' — ' . ($newToken['error_description'] ?? 'check your GOOGLE_REFRESH_TOKEN in .env')
            );
        }

        return $client;
    }

    /**
     * Register inbox for push notifications.
     * Run once via: php artisan tinker
     * >>> app(\App\Http\Controllers\Webhooks\GmailWebhookController::class)->setupWatch()
     */
    public function setupWatch(): void
    {
        $client  = $this->buildGoogleClient();
        $gmail   = new Gmail($client);
        $request = new \Google\Service\Gmail\WatchRequest();
        $request->setTopicName(config('services.google.pubsub_topic'));
        $request->setLabelIds(['INBOX']);
        $resp = $gmail->users->watch('me', $request);
        Log::info('[RMTY Inquiry] Gmail watch registered', [
            'historyId'  => $resp->getHistoryId(),
            'expiration' => $resp->getExpiration(),
        ]);
    }
}