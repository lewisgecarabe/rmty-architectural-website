<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookSender
{
    private string $apiVersion = 'v19.0';

    public function send(string $recipientId, string $message): bool
    {
        try {
            $token = PlatformSetting::getValue('facebook', 'page_access_token')
                  ?? config('services.meta.page_access_token');

            if (!$token) {
                throw new \RuntimeException('Facebook not connected. Complete OAuth setup in admin settings.');
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

            Log::info('[RMTY Facebook] Reply sent', ['recipient' => $recipientId]);
            return true;

        } catch (\Throwable $e) {
            Log::error('[RMTY Facebook] Send failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}