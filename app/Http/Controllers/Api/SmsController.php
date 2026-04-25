<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Http;

class SmsController
{
    public static function send($number, $message)
    {
        $url = env('SMS_API_URL');
        $apiKey = env('SMS_API_KEY');

        if (empty($url) || empty($apiKey)) {
            \Log::warning('SMS not sent — SMS_API_URL or SMS_API_KEY is not configured.', [
                'phone' => $number,
            ]);
            return false;
        }

        $response = Http::asForm()->post($url, [
            'apikey' => $apiKey,
            'number' => self::formatNumber($number),
            'message' => $message,
        ]);

        if (!$response->successful()) {
            \Log::error('SMS sending failed', [
                'phone' => $number,
                'body'  => $message,
                'error' => $response->body(),
                'sendername'  => env('SMS_SENDER_NAME'),
            ]);
        }

        return $response->successful();
    }

    private static function formatNumber($number)
    {
        // remove spaces, +, dashes, etc.
        $number = preg_replace('/\D/', '', $number);

        // if starts with 09 → convert to 639
        if (str_starts_with($number, '09')) {
            return '63' . substr($number, 1);
        }

        // if starts with 9 → convert to 639
        if (str_starts_with($number, '9')) {
            return '63' . $number;
        }

        // already correct (63...)
        return $number;
    }
}