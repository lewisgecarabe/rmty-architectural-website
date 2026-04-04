<?php

namespace App\Services;

use App\Models\GoogleSetting;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Illuminate\Support\Facades\Log;

/**
 * GmailSender — sends replies using the authenticated user's Gmail
 * File: app/Services/GmailSender.php
 */
class GmailSender
{
    public function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $body,
        ?string $threadId   = null,
        ?string $inReplyTo  = null,
        ?int    $userId     = 1,
        ?string $references = null,
    ): array|false {
        try {
            $client = $this->buildClient($userId);
            $gmail  = new Gmail($client);

            // Get the user's connected Gmail address as the From address
            $fromEmail = GoogleSetting::getValue('connected_email', $userId)
                      ?? config('services.google.reply_from_email');

            $built = $this->buildRaw($toEmail, $toName, $subject, $body, $inReplyTo, $fromEmail, $references);

            $message = new Message();
            $message->setRaw($built['raw']);
            if ($threadId) $message->setThreadId($threadId);

            $sentMessage = $gmail->users_messages->send('me', $message);

            $threadId  = $sentMessage->getThreadId();
            $messageId = $sentMessage->getId();

            // Fetch the actual RFC Message-ID Gmail assigned (may differ from our generated one)
            $rfcMessageId = $built['messageId'];
            try {
                $full = $gmail->users_messages->get('me', $messageId, [
                    'format'          => 'metadata',
                    'metadataHeaders' => 'Message-ID',
                ]);
                foreach ($full->getPayload()->getHeaders() as $header) {
                    if (strtolower($header->getName()) === 'message-id') {
                        $rfcMessageId = $header->getValue();
                        break;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('[RMTY Gmail] Could not fetch sent message headers, using generated ID', [
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('[RMTY Gmail] Message sent', [
                'threadId'      => $threadId,
                'messageId'     => $messageId,
                'rfcMessageId'  => $rfcMessageId,
            ]);

            return [
                'threadId'      => $threadId,
                'messageId'     => $messageId,
                'rfcMessageId'  => $rfcMessageId,
            ];

        } catch (\Throwable $e) {
            Log::error('[RMTY Gmail] Send failed', [
                'to'      => $toEmail,
                'error'   => $e->getMessage(),
                'user_id' => $userId,
            ]);
            return false;
        }
    }

    private function buildRaw(
        string $to,
        string $toName,
        string $subject,
        string $body,
        ?string $inReplyTo,
        string $fromEmail,
        ?string $references = null
    ): array {
        $name      = config('services.google.reply_from_name', 'RMTY Architectural');
        $subject   = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $messageId = '<' . uniqid('rmty.', true) . '@rmty-architectural.com>';

        $headers = [
            "Message-ID: {$messageId}",
            "From: {$name} <{$fromEmail}>",
            "To: {$toName} <{$to}>",
            "Subject: {$subject}",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: quoted-printable",
        ];

        if ($inReplyTo) {
            $headers[] = "In-Reply-To: {$inReplyTo}";
            $refs = $references ? "{$references} {$inReplyTo}" : $inReplyTo;
            $headers[] = "References: {$refs}";
        }

        $headers[] = "";
        $headers[] = quoted_printable_encode($body);

        return [
            'raw'       => rtrim(strtr(base64_encode(implode("\r\n", $headers)), '+/', '-_'), '='),
            'messageId' => $messageId,
        ];
    }

    private function buildClient(?int $userId): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_SEND);
        $client->addScope(Gmail::GMAIL_READONLY);
        $client->setAccessType('offline');

        $refreshToken = GoogleSetting::getValue('refresh_token', $userId);

        if (!$refreshToken) {
            throw new \RuntimeException('Gmail not connected for this user.');
        }

        $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);

        if (isset($token['error'])) {
            throw new \RuntimeException('Token refresh failed: ' . $token['error']);
        }

        return $client;
    }
}