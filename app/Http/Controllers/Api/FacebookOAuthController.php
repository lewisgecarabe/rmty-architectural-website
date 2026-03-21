<?php

namespace App\Http\Controllers\Api;

use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookOAuthController
{
    private string $apiVersion = 'v19.0';

    // GET /api/admin/facebook/auth-url
    public function getAuthUrl(): JsonResponse
    {
        $params = http_build_query([
            'client_id'     => config('services.meta.app_id'),
            'redirect_uri'  => config('app.url') . '/api/admin/facebook/callback',
'scope' => 'pages_messaging',
            'response_type' => 'code',
        ]);

        return response()->json([
            'url' => "https://www.facebook.com/{$this->apiVersion}/dialog/oauth?{$params}"
        ]);
    }

    // GET /api/admin/facebook/callback
    public function handleCallback(Request $request)
    {
        $code  = $request->query('code');
        $error = $request->query('error');

        if ($error || !$code) {
            return redirect(config('app.frontend_url') . '/admin/settings?facebook=denied');
        }

        try {
            // Step 1: code → short-lived user token
            $shortToken = $this->exchangeCode($code);

            // Step 2: short-lived → long-lived token (60 days)
            $longToken  = $this->exchangeLongLived($shortToken);

            // Step 3: long-lived → permanent page token
            $page = $this->getPageToken($longToken);

            if (!$page) {
                return redirect(config('app.frontend_url') . '/admin/settings?facebook=no_page');
            }

            // Save Facebook to DB
            PlatformSetting::setValue('facebook', 'page_access_token', $page['token']);
            PlatformSetting::setValue('facebook', 'page_id',           $page['id']);
            PlatformSetting::setValue('facebook', 'page_name',         $page['name']);
            PlatformSetting::setValue('facebook', 'connected_at',      now()->toDateTimeString());

            // Get linked Instagram account
            $igId = $this->getInstagramId($page['id'], $page['token']);
            if ($igId) {
                PlatformSetting::setValue('instagram', 'account_id',   $igId);
                PlatformSetting::setValue('instagram', 'page_token',   $page['token']);
                PlatformSetting::setValue('instagram', 'connected_at', now()->toDateTimeString());
            }

            // Subscribe page to webhook
            $this->subscribeWebhook($page['id'], $page['token']);

            Log::info('[RMTY Facebook OAuth] Connected', [
                'page'      => $page['name'],
                'instagram' => $igId ?? 'none',
            ]);

            return redirect(config('app.frontend_url') . '/admin/settings?facebook=success');

        } catch (\Throwable $e) {
            Log::error('[RMTY Facebook OAuth] Error', ['error' => $e->getMessage()]);
            return redirect(config('app.frontend_url') . '/admin/settings?facebook=error');
        }
    }

    // GET /api/admin/facebook/status
    public function status(): JsonResponse
    {
        $token       = PlatformSetting::getValue('facebook', 'page_access_token');
        $pageName    = PlatformSetting::getValue('facebook', 'page_name');
        $connectedAt = PlatformSetting::getValue('facebook', 'connected_at');
        $igId        = PlatformSetting::getValue('instagram', 'account_id');

        // Just check if token exists in DB — skip live API call
        // to avoid SSL issues on local development
        $connected = !empty($token);

        return response()->json([
            'facebook' => [
                'connected'    => $connected,
                'expired'      => false,
                'page_name'    => $pageName,
                'connected_at' => $connectedAt,
            ],
            'instagram' => [
                'connected'  => !empty($igId),
                'account_id' => $igId,
            ],
        ]);
    }

    // DELETE /api/admin/facebook/disconnect
    public function disconnect(): JsonResponse
    {
        PlatformSetting::clearPlatform('facebook');
        PlatformSetting::clearPlatform('instagram');
        return response()->json(['message' => 'Facebook and Instagram disconnected.']);
    }

    // ── Private helpers ───────────────────────────────────────────

    private function exchangeCode(string $code): string
    {
        $res  = Http::get("https://graph.facebook.com/{$this->apiVersion}/oauth/access_token", [
            'client_id'     => config('services.meta.app_id'),
            'client_secret' => config('services.meta.app_secret'),
            'redirect_uri'  => config('app.url') . '/api/admin/facebook/callback',
            'code'          => $code,
        ]);
        $data = $res->json();
        if (isset($data['error'])) throw new \RuntimeException($data['error']['message']);
        return $data['access_token'];
    }

    private function exchangeLongLived(string $shortToken): string
    {
        $res  = Http::get("https://graph.facebook.com/{$this->apiVersion}/oauth/access_token", [
            'grant_type'        => 'fb_exchange_token',
            'client_id'         => config('services.meta.app_id'),
            'client_secret'     => config('services.meta.app_secret'),
            'fb_exchange_token' => $shortToken,
        ]);
        $data = $res->json();
        if (isset($data['error'])) throw new \RuntimeException($data['error']['message']);
        return $data['access_token'];
    }

    private function getPageToken(string $userToken): ?array
    {
        $res  = Http::get("https://graph.facebook.com/{$this->apiVersion}/me/accounts", [
            'access_token' => $userToken,
        ]);
        $data = $res->json();
        if (isset($data['error'])) throw new \RuntimeException($data['error']['message']);
        $page = $data['data'][0] ?? null;
        if (!$page) return null;
        return ['id' => $page['id'], 'name' => $page['name'], 'token' => $page['access_token']];
    }

    private function getInstagramId(string $pageId, string $token): ?string
    {
        $res = Http::get("https://graph.facebook.com/{$this->apiVersion}/{$pageId}", [
            'fields'       => 'instagram_business_account',
            'access_token' => $token,
        ]);
        return $res->json()['instagram_business_account']['id'] ?? null;
    }

    private function subscribeWebhook(string $pageId, string $token): void
    {
        Http::post("https://graph.facebook.com/{$this->apiVersion}/{$pageId}/subscribed_apps", [
            'subscribed_fields' => 'messages,messaging_postbacks',
            'access_token'      => $token,
        ]);
    }
}