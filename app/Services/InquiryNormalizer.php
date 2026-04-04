<?php

namespace App\Services;

use App\Models\Inquiry;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\InquiryNotification;

class InquiryNormalizer
{
    // ─── Gmail ────────────────────────────────────────────────────
    public function fromGmail(
        string $messageId,
        string $from,
        string $subject,
        string $body,
        array $rawPayload = [],
        ?int $userId = null
    ): ?Inquiry {
        try {
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
                'user_id'     => $userId,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Gmail normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Facebook Messenger ───────────────────────────────────────
    public function fromFacebook(
        string $senderId,
        string $messageId,
        ?string $name,
        string $message,
        array $rawPayload = []
    ): ?Inquiry {
        try {
            return $this->store([
                'platform'    => 'facebook',
                'external_id' => $messageId,
                'name'        => $name,
                'email'       => null,
                'phone'       => null,
                'message'     => $message,
                'raw_payload' => array_merge($rawPayload, ['sender_id' => $senderId]),
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Facebook normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Instagram DMs ────────────────────────────────────────────
    public function fromInstagram(
        string $senderId,
        string $messageId,
        ?string $name,
        string $message,
        array $rawPayload = []
    ): ?Inquiry {
        try {
            return $this->store([
                'platform'    => 'instagram',
                'external_id' => $messageId,
                'name'        => $name,
                'email'       => null,
                'phone'       => null,
                'message'     => $message,
                'raw_payload' => array_merge($rawPayload, ['sender_id' => $senderId]),
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Instagram normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Viber ────────────────────────────────────────────────────
    public function fromViber(
        string $senderId,
        string $messageId,
        ?string $name,
        string $message,
        array $rawPayload = []
    ): ?Inquiry {
        try {
            return $this->store([
                'platform'    => 'viber',
                'external_id' => $messageId,
                'name'        => $name,
                'email'       => null,
                'phone'       => null,
                'message'     => $message,
                'raw_payload' => array_merge($rawPayload, ['sender_id' => $senderId]),
            ]);
        } catch (\Throwable $e) {
            Log::error('[Inquiry] Viber normalize error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── Website Contact Form ─────────────────────────────────────
    public function fromWebsite(array $data, ?int $userId = null): ?Inquiry
    {
        try {
            $inquiry = $this->store([
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
    private function store(array $data): Inquiry
    {
        if (!empty($data['external_id'])) {
            $inquiry = Inquiry::firstOrCreate(
                ['external_id' => $data['external_id']],
                $data
            );
        } else {
            $inquiry = Inquiry::create($data);
        }

        
        Mail::to('gecarane@gmail.com')->send(new InquiryNotification($inquiry));

        return $inquiry;
    }
}