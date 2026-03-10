<?php

namespace App\Services;

use App\Models\Inquiry;
use Illuminate\Support\Facades\Log;

/**
 * InquiryNormalizer
 * File: app/Services/InquiryNormalizer.php
 *
 * Single responsibility: map each platform's raw webhook payload
 * into the unified Inquiry schema, then persist it.
 *
 * Usage: inject via constructor or resolve from container.
 */
class InquiryNormalizer
{
    // ─── Gmail ────────────────────────────────────────────────────

    /**
     * Store a Gmail message fetched via Gmail API.
     * Called from GmailWebhookController after fetching the full email.
     *
     * @param string $messageId   Gmail message ID
     * @param string $from        "Name <email@example.com>" header value
     * @param string $subject     Email subject line
     * @param string $body        Decoded plain-text body
     * @param array  $rawPayload  Full API response for audit trail
     */
    public function fromGmail(
        string $messageId,
        string $from,
        string $subject,
        string $body,
        array $rawPayload = []
    ): ?Inquiry {
        try {
            // Parse "Display Name <email@address.com>"
            preg_match('/^(.*?)\s*<([^>]+)>$/', $from, $m);
            $name  = trim($m[1] ?? $from);
            $email = trim($m[2] ?? $from);

            return $this->store([
                'platform'    => 'gmail',
                'external_id' => $messageId,
                'name'        => $name ?: null,
                'email'       => filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null,
                'phone'       => null,
                'message'     => trim("Subject: {$subject}\n\n{$body}"),
                'raw_payload' => $rawPayload,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Gmail normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Facebook Messenger ───────────────────────────────────────

    /**
     * Store a Facebook Messenger message from a Meta webhook entry.
     *
     * @param array $entry  Single entry from payload['entry']
     */
    public function fromFacebook(array $entry): ?Inquiry
    {
        try {
            $messaging = $entry['messaging'][0] ?? null;
            if (!$messaging || empty($messaging['message']['text'])) {
                return null; // ignore non-text events (read receipts, typing, etc.)
            }

            return $this->store([
                'platform'    => 'facebook',
                'external_id' => $messaging['message']['mid'] ?? null,
                'name'        => null, // Requires separate /senderId Graph API call
                'email'       => null, // Facebook DMs never expose email
                'phone'       => null,
                'message'     => $messaging['message']['text'],
                'raw_payload' => $entry,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Facebook normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Instagram DMs ────────────────────────────────────────────

    /**
     * Store an Instagram Direct Message from a Meta webhook entry.
     * Uses same Meta webhook as Facebook — differentiated by object='instagram'.
     */
    public function fromInstagram(array $entry): ?Inquiry
    {
        try {
            $messaging = $entry['messaging'][0] ?? null;
            if (!$messaging || empty($messaging['message']['text'])) {
                return null;
            }

            return $this->store([
                'platform'    => 'instagram',
                'external_id' => $messaging['message']['mid'] ?? null,
                'name'        => null,
                'email'       => null,
                'phone'       => null,
                'message'     => $messaging['message']['text'],
                'raw_payload' => $entry,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Instagram normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Twilio SMS ───────────────────────────────────────────────

    /**
     * Store a Twilio SMS.
     * Twilio sends application/x-www-form-urlencoded POST data.
     */
    public function fromSms(array $payload): ?Inquiry
    {
        try {
            if (empty($payload['Body'])) return null;

            return $this->store([
                'platform'    => 'sms',
                'external_id' => $payload['SmsSid'] ?? null,
                'name'        => null,
                'email'       => null,
                'phone'       => $payload['From'] ?? null,
                'message'     => $payload['Body'],
                'raw_payload' => $payload,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] SMS normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Viber ────────────────────────────────────────────────────

    /**
     * Store a Viber Bot message.
     */
    public function fromViber(array $payload): ?Inquiry
    {
        try {
            if (($payload['event'] ?? '') !== 'message') return null;
            if (empty($payload['message']['text'])) return null;

            return $this->store([
                'platform'    => 'viber',
                'external_id' => isset($payload['message_token'])
                    ? (string) $payload['message_token']
                    : null,
                'name'        => $payload['sender']['name'] ?? null,
                'email'       => null,
                'phone'       => null,
                'message'     => $payload['message']['text'],
                'raw_payload' => $payload,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Viber normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Website Contact Form ─────────────────────────────────────

    /**
     * Store a manual website contact form submission.
     * Called directly from InquiryController@store.
     */
    public function fromWebsite(array $data): ?Inquiry
    {
        try {
            return $this->store([
                'platform' => 'website',
                'name'     => $data['name'] ?? null,
                'email'    => $data['email'] ?? null,
                'phone'    => $data['phone'] ?? null,
                'message'  => $data['message'],
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Website normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Internal ─────────────────────────────────────────────────

    /**
     * Persist inquiry, skipping duplicates by external_id.
     */
    private function store(array $data): Inquiry
    {
        if (!empty($data['external_id'])) {
            return Inquiry::firstOrCreate(
                ['external_id' => $data['external_id']],
                $data
            );
        }

        return Inquiry::create($data);
    }
}