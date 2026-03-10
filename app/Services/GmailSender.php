<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Illuminate\Support\Facades\Log;

/**
 * GmailSender
 * File: app/Services/GmailSender.php
 *
 * Sends reply emails via the Gmail API using the same OAuth credentials
 * already configured for receiving emails.
 *
 * The email is sent FROM your Gmail account (lgecarane@gmail.com)
 * TO the inquiry sender's email address.
 */
class GmailSender
{
    /**
     * Send a reply email.
     *
     * @param string      $toEmail    Recipient email address
     * @param string      $toName     Recipient display name
     * @param string      $subject    Email subject
     * @param string      $body       Plain-text reply body
     * @param string|null $threadId   Gmail thread ID to keep it as a reply in the same thread
     */
    public function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $body,
        ?string $threadId = null,
        ?string $inReplyTo = null   // original Message-ID header value
    ): bool {
        try {
            $client = $this->buildClient();
            $gmail  = new Gmail($client);

            // Build RFC 2822 raw email
            $raw = $this->buildRawEmail(
                to:        $toEmail,
                toName:    $toName,
                subject:   $subject,
                body:      $body,
                threadId:  $threadId,
                inReplyTo: $inReplyTo
            );

            $message = new Message();
            $message->setRaw($raw);

            // Keep reply in same Gmail thread if threadId provided
            if ($threadId) {
                $message->setThreadId($threadId);
            }

            $gmail->users_messages->send('me', $message);

            Log::info('[RMTY Gmail] Reply sent', [
                'to'      => $toEmail,
                'subject' => $subject,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error('[RMTY Gmail] Failed to send reply', [
                'to'    => $toEmail,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build a base64url-encoded RFC 2822 email string.
     * This is the format Gmail API expects in the 'raw' field.
     */
    private function buildRawEmail(
        string $to,
        string $toName,
        string $subject,
        string $body,
        ?string $threadId  = null,
        ?string $inReplyTo = null
    ): string {
        $fromEmail = config('services.google.reply_from_email');
        $fromName  = config('services.google.reply_from_name', 'RMTY Architectural');

        // Encode subject for non-ASCII characters
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

        $headers = [
            "From: {$fromName} <{$fromEmail}>",
            "To: {$toName} <{$to}>",
            "Subject: {$encodedSubject}",
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=UTF-8",
            "Content-Transfer-Encoding: quoted-printable",
        ];

        // These two headers are what Gmail uses to thread replies correctly.
        // In-Reply-To  = Message-ID of the email being replied to
        // References   = full chain of Message-IDs in the thread
        if ($inReplyTo) {
            $headers[] = "In-Reply-To: {$inReplyTo}";
            $headers[] = "References: {$inReplyTo}";
        }

        $headers[] = "";
        $headers[] = quoted_printable_encode($body);

        $email = implode("\r\n", $headers);

        // Gmail API requires URL-safe base64 (replace + with - and / with _)
        return rtrim(strtr(base64_encode($email), '+/', '-_'), '=');
    }

    /**
     * Build authenticated Google client using refresh token.
     */
    private function buildClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_SEND);
        $client->setAccessType('offline');

        $newToken = $client->fetchAccessTokenWithRefreshToken(
            config('services.google.refresh_token')
        );

        if (isset($newToken['error'])) {
            throw new \RuntimeException(
                'Gmail token refresh failed: ' . $newToken['error'] .
                ' — ' . ($newToken['error_description'] ?? '')
            );
        }

        return $client;
    }
}