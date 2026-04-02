<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * FacebookSender — sends replies using the authenticated user's page token
 * File: app/Services/FacebookSender.php
 */
class FacebookSender
{
    private string $apiVersion = 'v19.0';

    public function send(string $recipientId, string $message, ?int $userId = null): bool
    {
        try {
            $token = PlatformSetting::getValue('facebook', 'page_access_token', $userId);

            if (!$token) {
                throw new \RuntimeException('Facebook not connected for this user.');
            }

            $res  = Http::post(
                "https://graph.facebook.com/{$this->apiVersion}/me/messages",
                [
                    'recipient'      => ['id' => $recipientId],
                    'message'        => ['text' => $message],
                    'messaging_type' => 'RESPONSE',
                    'access_token'   => $token,
                ]
            );

            $data = $res->json();

            if (isset($data['error'])) {
                throw new \RuntimeException('Facebook API: ' . $data['error']['message']);
            }

            Log::info('[RMTY Facebook] Reply sent', [
                'recipient' => $recipientId,
                'user_id'   => $userId,
            ]);
            return true;

        } catch (\Throwable $e) {
            Log::error('[RMTY Facebook] Send failed', [
                'error'   => $e->getMessage(),
                'user_id' => $userId,
            ]);
            return false;
        }
    }
}