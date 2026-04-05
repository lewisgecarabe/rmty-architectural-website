<?php

namespace App\Http\Controllers\Webhooks;

use App\Models\GoogleSetting;
use App\Models\Inquiry;
use App\Services\InquiryNormalizer;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * GmailWebhookController — routes incoming emails to correct user
 * File: app/Http/Controllers/Webhooks/GmailWebhookController.php
 */
class GmailWebhookController
{
    public function __construct(
        private readonly InquiryNormalizer $normalizer
    ) {}

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

        $emailAddress = $data['emailAddress'] ?? '';

        // Find which user owns this Gmail address
        $userId = GoogleSetting::findUserByEmail($emailAddress);

        if (!$userId) {
            Log::warning('[RMTY Gmail] No user found for email', ['email' => $emailAddress]);
            return response('OK', 200); // return 200 to stop retries
        }

        $this->fetchAndStore($emailAddress, $userId);

        return response('OK', 200);
    }

    private function fetchAndStore(string $emailAddress, int $userId): void
    {
        try {
            $client = $this->buildClient($userId);
            $gmail  = new Gmail($client);

            $list = $gmail->users_messages->listUsersMessages('me', [
                'q'          => 'in:inbox',
                'maxResults' => 10,
            ]);

            foreach ($list->getMessages() ?? [] as $ref) {
                if (Inquiry::where('external_id', $ref->getId())->exists()) {
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
                    $ref->getId(),      
                    $from,              
                    $subject,           
                    $body,              
                    [                   
                        'messageId'      => $ref->getId(),
                        'threadId'       => $full->getThreadId(),
                        'gmailMessageId' => $msgId,
                        'from'           => $from,
                        'subject'        => $subject,
                        'user_id'        => $userId,
                    ],
                    $userId             // Just the variable itself, no label before it.
                );
            }
        } catch (\Throwable $e) {
            Log::error('[RMTY Gmail] Fetch error', [
                'error'   => $e->getMessage(),
                'user_id' => $userId,
            ]);
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

    private function buildClient(int $userId): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_READONLY);
        $client->setAccessType('offline');

        $refreshToken = GoogleSetting::getValue('refresh_token', $userId);

        if (!$refreshToken) {
            throw new \RuntimeException("No Gmail token for user {$userId}");
        }

        $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);

        if (isset($token['error'])) {
            throw new \RuntimeException('Token refresh failed: ' . $token['error']);
        }

        return $client;
    }

    public function setupWatch(int $userId): void
    {
        $client  = $this->buildClient($userId);
        $gmail   = new Gmail($client);
        $req     = new \Google\Service\Gmail\WatchRequest();
        $req->setTopicName(config('services.google.pubsub_topic'));
        $req->setLabelIds(['INBOX']);
        $resp = $gmail->users->watch('me', $req);

        GoogleSetting::setValue('watch_expiry', $resp->getExpiration(), $userId);

        Log::info('[RMTY Gmail] Watch registered', [
            'user_id'    => $userId,
            'historyId'  => $resp->getHistoryId(),
            'expiration' => $resp->getExpiration(),
        ]);
    }
}