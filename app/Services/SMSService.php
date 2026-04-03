<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SMSService
{
    public static function send($number, $message)
    {
        $url = env('SMS_API_URL');
        $apiKey = env('SMS_API_KEY');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Accept' => 'application/json',
        ])->post($url, [
            'number' => $number,
            'message' => $message,
        ]);

        return $response->json();
    }
}
