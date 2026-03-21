<?php

namespace App\Http\Controllers\Api;

use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ViberSettingsController
{
    // GET /api/admin/viber/status
    public function status(): JsonResponse
    {
        $token       = PlatformSetting::getValue('viber', 'token');
        $botName     = PlatformSetting::getValue('viber', 'bot_name');
        $connectedAt = PlatformSetting::getValue('viber', 'connected_at');

        $tokenValid = false;
        if ($token) {
            try {
                $res = Http::withHeaders(['X-Viber-Auth-Token' => $token])
                    ->post('https://chatapi.viber.com/pa/get_account_info');
                $tokenValid = ($res->json()['status'] ?? -1) === 0;
            } catch (\Throwable) {}
        }

        return response()->json([
            'connected'    => !empty($token) && $tokenValid,
            'expired'      => !empty($token) && !$tokenValid,
            'bot_name'     => $botName,
            'connected_at' => $connectedAt,
        ]);
    }

    // POST /api/admin/viber/connect
    // Body: { "token": "your_viber_bot_token" }
    public function connect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|min:10',
        ]);

        $token = $validated['token'];

        // Verify token
        try {
            $res  = Http::withHeaders(['X-Viber-Auth-Token' => $token])
                ->post('https://chatapi.viber.com/pa/get_account_info');
            $data = $res->json();

            if (($data['status'] ?? -1) !== 0) {
                return response()->json([
                    'error' => 'Invalid token: ' . ($data['status_message'] ?? 'unknown'),
                ], 422);
            }

            $botName = $data['name'] ?? 'Viber Bot';

        } catch (\Throwable $e) {
            return response()->json(['error' => 'Could not reach Viber API: ' . $e->getMessage()], 500);
        }

        // Save to DB
        PlatformSetting::setValue('viber', 'token',        $token);
        PlatformSetting::setValue('viber', 'bot_name',     $botName);
        PlatformSetting::setValue('viber', 'connected_at', now()->toDateTimeString());

        // Register webhook
        $this->registerWebhook($token);

        Log::info('[RMTY Viber] Connected', ['bot' => $botName]);

        return response()->json([
            'message'  => 'Viber connected successfully.',
            'bot_name' => $botName,
        ]);
    }

    // DELETE /api/admin/viber/disconnect
    public function disconnect(): JsonResponse
    {
        $token = PlatformSetting::getValue('viber', 'token');

        if ($token) {
            try {
                Http::withHeaders(['X-Viber-Auth-Token' => $token])
                    ->post('https://chatapi.viber.com/pa/set_webhook', ['url' => '']);
            } catch (\Throwable) {}
        }

        PlatformSetting::clearPlatform('viber');
        return response()->json(['message' => 'Viber disconnected.']);
    }

    private function registerWebhook(string $token): void
    {
        try {
            $res = Http::withHeaders(['X-Viber-Auth-Token' => $token])
                ->post('https://chatapi.viber.com/pa/set_webhook', [
                    'url'         => config('app.url') . '/api/webhooks/viber',
                    'event_types' => ['message', 'subscribed', 'conversation_started'],
                    'send_name'   => true,
                ]);

            $data = $res->json();
            if (($data['status'] ?? -1) !== 0) {
                Log::warning('[RMTY Viber] Webhook registration failed', $data);
            }
        } catch (\Throwable $e) {
            Log::error('[RMTY Viber] Webhook error', ['error' => $e->getMessage()]);
        }
    }
}