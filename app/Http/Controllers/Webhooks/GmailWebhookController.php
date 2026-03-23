<?php

namespace App\Http\Controllers\Webhooks;

use App\Models\GoogleSetting;
use App\Services\InquiryNormalizer;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class GmailWebhookController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer
    ) {}

    // POST /api/webhooks/gmail
    public function handle(Request $request): Response
    {
        $payload = $request->json()->all();

        if (empty($payload['message'])) {
            return response('No message', 400);
        }

        $data = json_decode(
            base64_decode($payload['message']['data'] ?? ''),
            true
        );

        Log::info('[RMTY Gmail] Pub/Sub notification', ['data' => $data]);

        $this->fetchAndStore($data['emailAddress'] ?? '');

        // Always return 200 — non-200 causes Pub/Sub to retry
        return response('OK', 200);
    }

    private function fetchAndStore(string $emailAddress): void
    {
        try {
            $client = $this->buildClient();
            $gmail  = new Gmail($client);

            $list = $gmail->users_messages->listUsersMessages('me', [
                'q'          => 'is:unread in:inbox',
                'maxResults' => 10,
            ]);

            foreach ($list->getMessages() ?? [] as $ref) {
                // Skip duplicates
                if (\App\Models\Inquiry::where('external_id', $ref->getId())->exists()) {
                    continue;
                }

                $full    = $gmail->users_messages->get('me', $ref->getId(), ['format' => 'full']);
                $headers = collect($full->getPayload()->getHeaders())->keyBy('name');

                $from    = $headers->get('From')?->getValue() ?? '';
                $subject = $headers->get('Subject')?->getValue() ?? '(No subject)';
                $msgId   = $headers->get('Message-ID')?->getValue()
                        ?? $headers->get('Message-Id')?->getValue();
                $body    = $this->extractBody($full->getPayload());

                $this->normalizer->fromGmail(
                    messageId:  $ref->getId(),
                    from:       $from,
                    subject:    $subject,
                    body:       $body,
                    rawPayload: [
                        'messageId'      => $ref->getId(),
                        'threadId'       => $full->getThreadId(),
                        'gmailMessageId' => $msgId,
                        'from'           => $from,
                        'subject'        => $subject,
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::error('[RMTY Gmail] Fetch error', ['error' => $e->getMessage()]);
        }
    }

    private function extractBody(\Google\Service\Gmail\MessagePart $part): string
    {
        foreach ($part->getParts() ?? [] as $subpart) {
            if ($subpart->getMimeType() === 'text/plain') {
                return base64_decode(strtr($subpart->getBody()->getData(), '-_', '+/'));
            }
        }
        $data = $part->getBody()?->getData();
        return $data ? base64_decode(strtr($data, '-_', '+/')) : '';
    }

    private function buildClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_READONLY);
        $client->setAccessType('offline');

        // Read from DB first, fallback to .env
        $refreshToken = GoogleSetting::getValue('refresh_token')
                     ?? config('services.google.refresh_token');

        if (!$refreshToken) {
            throw new \RuntimeException('Gmail not connected. Complete OAuth setup in admin settings.');
        }

        $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);

        if (isset($token['error'])) {
            throw new \RuntimeException('Token refresh failed: ' . $token['error']);
        }

        return $client;
    }

    // Run once to register Gmail watch:
    // php artisan tinker
    // >>> app(\App\Http\Controllers\Webhooks\GmailWebhookController::class)->setupWatch()
    public function setupWatch(): void
    {
        $client  = $this->buildClient();
        $gmail   = new Gmail($client);
        $req     = new \Google\Service\Gmail\WatchRequest();
        $req->setTopicName(config('services.google.pubsub_topic'));
        $req->setLabelIds(['INBOX']);
        $resp = $gmail->users->watch('me', $req);

        GoogleSetting::setValue('watch_expiry', $resp->getExpiration());

        Log::info('[RMTY Gmail] Watch registered', [
            'historyId'  => $resp->getHistoryId(),
            'expiration' => $resp->getExpiration(),
        ]);
    }
}