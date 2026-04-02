<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class SmsController extends Controller
{
    public static function send(string $phone, string $message): bool
    {
        try {
            $formattedPhone = self::formatPhoneNumber($phone);

            if (!$formattedPhone) {
                Log::warning('SMS not sent: invalid phone number.', [
                    'original_phone' => $phone,
                ]);
                return false;
            }

            $apiUrl = env('SMS_API_URL', 'https://smsapiph.onrender.com/api/v1/send/sms');
            $apiKey = env('SMS_API_KEY');

            if (!$apiKey) {
                Log::error('SMS not sent: SMS_API_KEY is missing.');
                return false;
            }

            $payload = [
                'recipient' => $formattedPhone,
                'message'   => $message,
            ];

            $ch = curl_init($apiUrl);

            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'x-api-key: ' . $apiKey,
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_TIMEOUT => 20,
                CURLOPT_CONNECTTIMEOUT => 10,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);

            curl_close($ch);

            if ($response === false || $curlError) {
                Log::error('SMS request failed.', [
                    'phone' => $formattedPhone,
                    'curl_error' => $curlError,
                ]);
                return false;
            }

            if ($httpCode < 200 || $httpCode >= 300) {
                Log::error('SMS API returned a non-success status.', [
                    'phone' => $formattedPhone,
                    'http_code' => $httpCode,
                    'response' => $response,
                ]);
                return false;
            }

            Log::info('SMS sent successfully.', [
                'phone' => $formattedPhone,
                'http_code' => $httpCode,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('SMS sending threw an exception.', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private static function formatPhoneNumber(string $phone): ?string
    {
        $clean = preg_replace('/\D+/', '', $phone ?? '');

        if (!$clean) {
            return null;
        }

        // 09xxxxxxxxx -> +639xxxxxxxxx
        if (preg_match('/^09\d{9}$/', $clean)) {
            return '+63' . substr($clean, 1);
        }

        // 9xxxxxxxxx -> +639xxxxxxxxx
        if (preg_match('/^9\d{9}$/', $clean)) {
            return '+63' . $clean;
        }

        // 639xxxxxxxxx -> +639xxxxxxxxx
        if (preg_match('/^639\d{9}$/', $clean)) {
            return '+' . $clean;
        }

        // 00639xxxxxxxxx -> +639xxxxxxxxx
        if (preg_match('/^00639\d{9}$/', $clean)) {
            return '+' . substr($clean, 2);
        }

        return null;
    }
}