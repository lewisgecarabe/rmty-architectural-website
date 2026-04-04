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
        ?string $threadId  = null,
        ?string $inReplyTo = null,
        ?int    $userId    = 1,
    ): array {
        try {
            $client = $this->buildClient($userId);
            $gmail  = new Gmail($client);

            // Get the user's connected Gmail address as the From address
            $fromEmail = GoogleSetting::getValue('connected_email', $userId)
                      ?? config('services.google.reply_from_email');

            $raw = $this->buildRaw($toEmail, $toName, $subject, $body, $inReplyTo, $fromEmail);

            $message = new Message();
            $message->setRaw($raw);
            if ($threadId) $message->setThreadId($threadId);

            $sentMessage = $gmail->users_messages->send('me', $message);

            
            $threadId = $sentMessage->getThreadId();
            $messageId = $sentMessage->getId();

            Log::info('[RMTY Gmail] Message sent with thread', [
                'threadId' => $threadId,
                'messageId' => $messageId,
            ]);

            
            return [
                'threadId' => $threadId,
                'messageId' => $messageId,
            ];

            return [
                'threadId' => $threadId,
                'messageId' => $messageId,
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
    string $fromEmail
): string {
    $name    = config('services.google.reply_from_name', 'RMTY Architectural');
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    
    $messageId = '<' . uniqid() . '@rmty-architectural.com>';

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
        $headers[] = "In-Reply-To: <{$inReplyTo}>";
        $headers[] = "References: <{$inReplyTo}>";
    }

    $headers[] = "";
    $headers[] = quoted_printable_encode($body);

    return rtrim(strtr(base64_encode(implode("\r\n", $headers)), '+/', '-_'), '=');
}

    private function buildClient(?int $userId): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_SEND);
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