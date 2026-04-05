<?php

namespace App\Http\Controllers\Api;

use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * FacebookOAuthController — per-user Facebook OAuth
 * File: app/Http/Controllers/Api/FacebookOAuthController.php
 */
class FacebookOAuthController
{
    private string $apiVersion = 'v19.0';

    // GET /api/admin/facebook/auth-url
    public function getAuthUrl(): JsonResponse
    {
        $params = http_build_query([
            'client_id'     => config('services.meta.app_id'),
            'redirect_uri'  => config('app.url') . '/api/admin/facebook/callback',
'scope' => implode(',', [
    'public_profile',
    'business_management',
    'pages_show_list',
    'pages_messaging',
    'pages_read_engagement',
    'pages_manage_metadata',
    'instagram_basic',
    'instagram_manage_messages'
]),
            'response_type' => 'code',
            'state'         => auth()->id(), // pass user_id via state
        ]);

        return response()->json([
            'url' => "https://www.facebook.com/{$this->apiVersion}/dialog/oauth?{$params}"
        ]);
    }

    // GET /api/admin/facebook/callback
    public function handleCallback(Request $request)
    {
        $code   = $request->query('code');
        $state  = $request->query('state'); // user_id
        $error  = $request->query('error');
        $userId = (int) $state;

        if ($error || !$code || !$userId) {
            return redirect(config('app.url') . '/admin/settings?facebook=denied');
        }

        try {
            $shortToken = $this->exchangeCode($code);
            $longToken  = $this->exchangeLongLived($shortToken);
            $page       = $this->getPageToken($longToken);

            if (!$page) {
                return redirect(config('app.url') . '/admin/settings?facebook=no_page');
            }

            // Save per-user Facebook tokens
            PlatformSetting::setValue('facebook', 'page_access_token', $page['token'], $userId);
            PlatformSetting::setValue('facebook', 'page_id',           $page['id'],    $userId);
            PlatformSetting::setValue('facebook', 'page_name',         $page['name'],  $userId);
            PlatformSetting::setValue('facebook', 'connected_at',      now()->toDateTimeString(), $userId);

            // Get linked Instagram account
            $igId = $this->getInstagramId($page['id'], $page['token']);
            if ($igId) {
                PlatformSetting::setValue('instagram', 'account_id',   $igId,          $userId);
                PlatformSetting::setValue('instagram', 'access_token',   $page['token'], $userId);
                PlatformSetting::setValue('instagram', 'connected_at', now()->toDateTimeString(), $userId);
            }

            $this->subscribeWebhook($page['id'], $page['token']);

            Log::info('[RMTY Facebook OAuth] Connected', [
                'user_id' => $userId,
                'page'    => $page['name'],
            ]);

            return redirect(config('app.url') . '/admin/settings?facebook=success');

        } catch (\Throwable $e) {
            Log::error('[RMTY Facebook OAuth] Error', ['error' => $e->getMessage()]);
            return redirect(config('app.url') . '/admin/settings?facebook=error');
        }
    }

    // GET /api/admin/facebook/status
    public function status(): JsonResponse
    {
        $userId      = auth()->id();
        $token       = PlatformSetting::getValue('facebook', 'page_access_token', $userId);
        $pageName    = PlatformSetting::getValue('facebook', 'page_name',         $userId);
        $connectedAt = PlatformSetting::getValue('facebook', 'connected_at',      $userId);
        $igId        = PlatformSetting::getValue('instagram', 'account_id',       $userId);

        return response()->json([
            'facebook' => [
                'connected'    => !empty($token),
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
        $userId = auth()->id();
        PlatformSetting::clearPlatform('facebook',  $userId);
        PlatformSetting::clearPlatform('instagram', $userId);
        return response()->json(['message' => 'Facebook and Instagram disconnected.']);
    }

    // POST /api/admin/facebook/connect-manual
    public function connectManual(Request $request): JsonResponse
    {
        $userId    = auth()->id();
        $validated = $request->validate([
            'page_access_token' => 'required|string',
            'page_id'           => 'required|string',
            'page_name'         => 'required|string',
        ]);

        PlatformSetting::setValue('facebook', 'page_access_token', $validated['page_access_token'], $userId);
        PlatformSetting::setValue('facebook', 'page_id',           $validated['page_id'],           $userId);
        PlatformSetting::setValue('facebook', 'page_name',         $validated['page_name'],         $userId);
        PlatformSetting::setValue('facebook', 'connected_at',      now()->toDateTimeString(),       $userId);

        return response()->json(['message' => 'Facebook connected.']);
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
            'subscribed_fields' => 'messages,messaging_postbacks,instagram',
            'access_token'      => $token,
        ]);
    }

    // POST /api/admin/instagram/connect-manual
    // POST /api/admin/instagram/connect-manual
public function connectInstagramManual(Request $request): JsonResponse
{
    $request->validate([
        'access_token' => 'nullable|string',
        'page_token'   => 'nullable|string',
        'page_id'      => 'nullable|string',
        'account_id'   => 'nullable|string',
    ]);

    $userId = auth()->id();

    $token = $request->input('access_token') ?? $request->input('page_token');
    $pageId = $request->input('page_id')
        ?? $request->input('account_id')
        ?? PlatformSetting::getValue('facebook', 'page_id', $userId)
        ?? '688344834362399';

    if (!$token) {
        return response()->json(['error' => 'Missing Instagram token'], 422);
    }

    PlatformSetting::setValue('instagram', 'access_token', $token, $userId);
    PlatformSetting::setValue('instagram', 'page_id', $pageId, $userId);
    PlatformSetting::setValue('instagram', 'connected_at', now()->toDateTimeString(), $userId);

    return response()->json([
        'message' => 'Instagram connected',
        'page_id' => $pageId,
    ]);
}

    // DELETE /api/admin/instagram/disconnect
    public function disconnectInstagram(): JsonResponse
    {
        $userId = auth()->id();
        PlatformSetting::clearPlatform('instagram', $userId);
        return response()->json(['message' => 'Instagram disconnected.']);
    }

    private function getSenderName(string $psid, string $pageToken): ?string
{
    $res = Http::get("https://graph.facebook.com/{$this->apiVersion}/{$psid}", [
        'fields' => 'name',
        'access_token' => $pageToken,
    ]);

    $data = $res->json();

    return $data['name'] ?? null;
}

}