<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * InstagramSender — sends replies via the Instagram Messaging API
 * File: app/Services/InstagramSender.php
 *
 * Requires:
 *  - instagram_manage_messages permission on your Meta app
 *  - The Page Access Token stored in platform_settings (instagram.page_token)
 *  - The Instagram Business Account ID stored (instagram.account_id)
 */
class InstagramSender
{
    private string $apiVersion = 'v19.0';

    public function send(string $recipientIgScopedId, string $message, ?int $userId = null): bool
    {
        try {
            // Instagram replies use the Page Access Token (same as Facebook)
            $token     = PlatformSetting::getValue('instagram', 'page_token',  $userId);
            $accountId = PlatformSetting::getValue('instagram', 'account_id',  $userId);

            if (!$token || !$accountId) {
                throw new \RuntimeException('Instagram not connected for this user.');
            }

            // Instagram Messaging API endpoint uses the IG Business Account ID
            $res = Http::post(
                "https://graph.facebook.com/{$this->apiVersion}/{$accountId}/messages",
                [
                    'recipient'      => ['id' => $recipientIgScopedId],
                    'message'        => ['text' => $message],
                    'messaging_type' => 'RESPONSE',
                    'access_token'   => $token,
                ]
            );

            $data = $res->json();

            if (isset($data['error'])) {
                throw new \RuntimeException('Instagram API: ' . $data['error']['message']);
            }

            Log::info('[RMTY Instagram] Reply sent', [
                'recipient' => $recipientIgScopedId,
                'user_id'   => $userId,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error('[RMTY Instagram] Send failed', [
                'error'   => $e->getMessage(),
                'user_id' => $userId,
            ]);
            return false;
        }
    }
}