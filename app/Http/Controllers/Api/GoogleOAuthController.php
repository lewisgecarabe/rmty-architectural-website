<?php

namespace App\Http\Controllers\Api;

use App\Models\GoogleSetting;
use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * GoogleOAuthController — per-user Gmail OAuth
 * File: app/Http/Controllers/Api/GoogleOAuthController.php
 */
class GoogleOAuthController
{
    // GET /api/admin/google/auth-url
    public function getAuthUrl(): JsonResponse
    {
        $client = $this->buildBaseClient();
        // Store user_id in state param so callback knows who is connecting
        $client->setState(auth()->id());
        return response()->json(['url' => $client->createAuthUrl()]);
    }

    // GET /api/admin/google/callback
    public function handleCallback(Request $request)
    {
        $code   = $request->query('code');
        $state  = $request->query('state');  // user_id passed via state param
        $error  = $request->query('error');
        $userId = (int) $state;

        if ($error || !$code || !$userId) {
            return redirect(config('app.url') . '/admin/settings?google=denied');
        }

        try {
            $client    = $this->buildBaseClient();
            $tokenData = $client->fetchAccessTokenWithAuthCode($code);

            if (isset($tokenData['error'])) {
                Log::error('[RMTY Google OAuth] Token exchange failed', $tokenData);
                return redirect(config('app.url') . '/admin/settings?google=error');
            }

            $refreshToken = $tokenData['refresh_token'] ?? null;

            if (!$refreshToken) {
                return redirect(config('app.url') . '/admin/settings?google=no_refresh_token');
            }

            // Save per-user tokens
            GoogleSetting::setValue('refresh_token', $refreshToken, $userId);
            GoogleSetting::setValue('connected_at',  now()->toDateTimeString(), $userId);

            // Get and store the Gmail address for webhook routing
            $client->setAccessToken($tokenData);
            $gmail = new Gmail($client);
            $profile = $gmail->users->getProfile('me');
            GoogleSetting::setValue('connected_email', $profile->getEmailAddress(), $userId);

            // Register Gmail watch for this user
            $this->registerWatch($client, $userId);

            Log::info('[RMTY Google OAuth] Connected', [
                'user_id' => $userId,
                'email'   => $profile->getEmailAddress(),
            ]);

            return redirect(config('app.url') . '/admin/settings?google=success');

        } catch (\Throwable $e) {
            Log::error('[RMTY Google OAuth] Error', ['error' => $e->getMessage()]);
            return redirect(config('app.url') . '/admin/settings?google=error');
        }
    }

    // GET /api/admin/google/status
    public function status(): JsonResponse
    {
        $userId      = auth()->id();
        $token       = GoogleSetting::getValue('refresh_token', $userId);
        $watchExpiry = GoogleSetting::getValue('watch_expiry',  $userId);
        $connectedAt = GoogleSetting::getValue('connected_at',  $userId);
        $email       = GoogleSetting::getValue('connected_email', $userId);
        $watchActive = $watchExpiry && (int)$watchExpiry > now()->timestamp * 1000;

        return response()->json([
            'connected'    => !empty($token),
            'email'        => $email,
            'watch_active' => $watchActive,
            'watch_expiry' => $watchExpiry ? date('Y-m-d H:i:s', (int)$watchExpiry / 1000) : null,
            'connected_at' => $connectedAt,
        ]);
    }

    // DELETE /api/admin/google/disconnect
    public function disconnect(): JsonResponse
    {
        $userId = auth()->id();
        $token  = GoogleSetting::getValue('refresh_token', $userId);

        if ($token) {
            try { $this->buildBaseClient()->revokeToken($token); } catch (\Throwable) {}
        }

        GoogleSetting::clearUser($userId);
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

    private function registerWatch(GoogleClient $client, int $userId): void
    {
        try {
            $gmail = new Gmail($client);
            $req   = new \Google\Service\Gmail\WatchRequest();
            $req->setTopicName(config('services.google.pubsub_topic'));
            $req->setLabelIds(['INBOX']);
            $resp = $gmail->users->watch('me', $req);
            GoogleSetting::setValue('watch_expiry', $resp->getExpiration(), $userId);
            Log::info('[RMTY Google OAuth] Watch registered', [
                'user_id' => $userId,
                'expiry'  => $resp->getExpiration(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('[RMTY Google OAuth] Watch failed', ['error' => $e->getMessage()]);
        }
    }
}