<?php

namespace App\Services;

use App\Models\GoogleSetting;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Illuminate\Support\Facades\Log;

class GmailSender
{
    public function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $body,
        ?string $threadId  = null,
        ?string $inReplyTo = null
    ): bool {
        try {
            $client = $this->buildClient();
            $gmail  = new Gmail($client);

            $raw = $this->buildRaw($toEmail, $toName, $subject, $body, $inReplyTo);

            $message = new Message();
            $message->setRaw($raw);
            if ($threadId) $message->setThreadId($threadId);

            $gmail->users_messages->send('me', $message);

            Log::info('[RMTY Gmail] Reply sent', ['to' => $toEmail]);
            return true;

        } catch (\Throwable $e) {
            Log::error('[RMTY Gmail] Send failed', ['to' => $toEmail, 'error' => $e->getMessage()]);
            return false;
        }
    }

    private function buildRaw(
        string $to,
        string $toName,
        string $subject,
        string $body,
        ?string $inReplyTo = null
    ): string {
        $from    = config('services.google.reply_from_email');
        $name    = config('services.google.reply_from_name', 'RMTY Architectural');
        $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

        $headers = [
            "From: {$name} <{$from}>",
            "To: {$toName} <{$to}>",
            "Subject: {$subject}",
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=UTF-8",
            "Content-Transfer-Encoding: quoted-printable",
        ];

        if ($inReplyTo) {
            $headers[] = "In-Reply-To: {$inReplyTo}";
            $headers[] = "References: {$inReplyTo}";
        }

        $headers[] = "";
        $headers[] = quoted_printable_encode($body);

        return rtrim(strtr(base64_encode(implode("\r\n", $headers)), '+/', '-_'), '=');
    }

    private function buildClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->addScope(Gmail::GMAIL_SEND);
        $client->setAccessType('offline');

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
}