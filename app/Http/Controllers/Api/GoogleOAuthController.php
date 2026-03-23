<?php

namespace App\Http\Controllers\Api;

use App\Models\GoogleSetting;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GoogleOAuthController
{
    // GET /api/admin/google/auth-url
    public function getAuthUrl(): JsonResponse
    {
        $client  = $this->buildBaseClient();
        return response()->json(['url' => $client->createAuthUrl()]);
    }

    // GET /api/admin/google/callback
    public function handleCallback(Request $request)
    {
        $code  = $request->query('code');
        $error = $request->query('error');

        if ($error || !$code) {
            return redirect(config('app.frontend_url') . '/admin/settings?google=denied');
        }

        try {
            $client    = $this->buildBaseClient();
            $tokenData = $client->fetchAccessTokenWithAuthCode($code);

            if (isset($tokenData['error'])) {
                Log::error('[RMTY Google OAuth] Token exchange failed', $tokenData);
                return redirect(config('app.frontend_url') . '/admin/settings?google=error');
            }

            $refreshToken = $tokenData['refresh_token'] ?? null;

            if (!$refreshToken) {
                return redirect(config('app.frontend_url') . '/admin/settings?google=no_refresh_token');
            }

            // Save to DB
            GoogleSetting::setValue('refresh_token', $refreshToken);
            GoogleSetting::setValue('connected_at',  now()->toDateTimeString());

            // Register Gmail watch immediately
            $this->registerWatch($client);

            Log::info('[RMTY Google OAuth] Connected successfully');
            return redirect(config('app.frontend_url') . '/admin/settings?google=success');

        } catch (\Throwable $e) {
            Log::error('[RMTY Google OAuth] Error', ['error' => $e->getMessage()]);
            return redirect(config('app.frontend_url') . '/admin/settings?google=error');
        }
    }

    // GET /api/admin/google/status
    public function status(): JsonResponse
    {
        $token       = GoogleSetting::getValue('refresh_token');
        $watchExpiry = GoogleSetting::getValue('watch_expiry');
        $connectedAt = GoogleSetting::getValue('connected_at');
        $watchActive = $watchExpiry && (int)$watchExpiry > now()->timestamp * 1000;

        return response()->json([
            'connected'    => !empty($token),
            'watch_active' => $watchActive,
            'watch_expiry' => $watchExpiry ? date('Y-m-d H:i:s', (int)$watchExpiry / 1000) : null,
            'connected_at' => $connectedAt,
        ]);
    }

    // DELETE /api/admin/google/disconnect
    public function disconnect(): JsonResponse
    {
        $token = GoogleSetting::getValue('refresh_token');
        if ($token) {
            try { $this->buildBaseClient()->revokeToken($token); } catch (\Throwable) {}
        }
        GoogleSetting::where('key', 'refresh_token')->delete();
        GoogleSetting::where('key', 'watch_expiry')->delete();
        GoogleSetting::where('key', 'connected_at')->delete();

        return response()->json(['message' => 'Gmail disconnected.']);
    }

    private function buildBaseClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setApplicationName('RMTY Architectural Website');
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('app.url') . '/api/admin/google/callback');
        $client->addScope(Gmail::GMAIL_READONLY);
        $client->addScope(Gmail::GMAIL_SEND);
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        return $client;
    }

    private function registerWatch(GoogleClient $client): void
    {
        try {
            $gmail = new Gmail($client);
            $req   = new \Google\Service\Gmail\WatchRequest();
            $req->setTopicName(config('services.google.pubsub_topic'));
            $req->setLabelIds(['INBOX']);
            $resp = $gmail->users->watch('me', $req);
            GoogleSetting::setValue('watch_expiry', $resp->getExpiration());
            Log::info('[RMTY Google OAuth] Watch registered', ['expiry' => $resp->getExpiration()]);
        } catch (\Throwable $e) {
            Log::warning('[RMTY Google OAuth] Watch failed', ['error' => $e->getMessage()]);
        }
    }
}