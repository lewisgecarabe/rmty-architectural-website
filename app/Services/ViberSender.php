<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ViberSender
{
    public function send(string $recipientId, string $name, string $message): bool
    {
        try {
            $token = PlatformSetting::getValue('viber', 'token')
                  ?? config('services.viber.token');

            if (!$token) {
                throw new \RuntimeException('Viber not connected. Add token in admin settings.');
            }

            $res = Http::withHeaders(['X-Viber-Auth-Token' => $token])
                ->post('https://chatapi.viber.com/pa/send_message', [
                    'receiver' => $recipientId,
                    'type'     => 'text',
                    'text'     => $message,
                    'sender'   => [
                        'name' => config('services.viber.bot_name', 'RMTY Architectural'),
                    ],
                ]);

            $data = $res->json();

            if (($data['status'] ?? -1) !== 0) {
                throw new \RuntimeException('Viber API error: ' . ($data['status_message'] ?? 'unknown'));
            }

            Log::info('[RMTY Viber] Reply sent', ['recipient' => $recipientId]);
            return true;

        } catch (\Throwable $e) {
            Log::error('[RMTY Viber] Send failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}