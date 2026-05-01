<?php

namespace App\Http\Controllers\Api;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsController
{
    public static function send($number, $message): bool
    {
        $url = env('SMS_API_URL');
        $apiKey = env('SMS_API_KEY');
        $senderName = env('SMS_SENDER_NAME');

        if (empty($url) || empty($apiKey)) {
            Log::warning('SMS not sent because SMS configuration is missing.', [
                'phone' => $number,
                'has_url' => !empty($url),
                'has_api_key' => !empty($apiKey),
            ]);

            return false;
        }

        $formattedNumber = self::formatNumber($number);

        if (empty($formattedNumber)) {
            Log::warning('SMS not sent because phone number is empty or invalid.', [
                'original_number' => $number,
            ]);

            return false;
        }

        $payload = [
            'apikey' => $apiKey,
            'number' => $formattedNumber,
            'message' => $message,
        ];

        /*
        |--------------------------------------------------------------------------
        | Sender Name
        |--------------------------------------------------------------------------
        | Only send sendername if it is not empty.
        | Your previous logs showed SMS_SENDER_NAME=RMTY caused:
        | "The senderName supplied is not valid"
        */
        if (!empty($senderName)) {
            $payload['sendername'] = $senderName;
        }

        try {
            Log::info('Sending SMS request.', [
                'url' => $url,
                'original_number' => $number,
                'formatted_number' => $formattedNumber,
                'sender_name' => $senderName ?: null,
            ]);

            $response = Http::asForm()
                ->timeout(20)
                ->post($url, $payload);

            Log::info('SMS API response received.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if (!$response->successful()) {
                Log::error('SMS API request failed.', [
                    'phone' => $formattedNumber,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);

                return false;
            }

            $data = $response->json();

            if (!is_array($data) || empty($data)) {
                Log::warning('SMS API returned unexpected response format.', [
                    'response' => $response->body(),
                ]);

                return false;
            }

            $first = $data[0] ?? $data;
            $smsStatus = strtolower((string) ($first['status'] ?? ''));

            /*
            |--------------------------------------------------------------------------
            | Semaphore usually returns "Pending" first
            |--------------------------------------------------------------------------
            | Pending means the provider accepted the message.
            | Actual phone delivery may be delayed by Semaphore/telco.
            */
            $successStatuses = ['pending', 'queued', 'sent', 'success'];

            if (in_array($smsStatus, $successStatuses, true)) {
                Log::info('SMS accepted by provider.', [
                    'phone' => $formattedNumber,
                    'message_id' => $first['message_id'] ?? null,
                    'status' => $first['status'] ?? null,
                ]);

                return true;
            }

            Log::warning('SMS was not accepted by provider.', [
                'phone' => $formattedNumber,
                'provider_status' => $first['status'] ?? null,
                'response' => $data,
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('SMS sending exception.', [
                'phone' => $formattedNumber,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

   /*
|--------------------------------------------------------------------------
| Manual Bell Reminder Message
|--------------------------------------------------------------------------
| Used when admin clicks the bell button.
*/
public static function buildReminderMessage($consultation): string
{
    $firstName = trim((string) ($consultation->first_name ?? ''));
    $name = $firstName !== '' ? $firstName : 'Client';

    $dateText = 'your scheduled date';
    $timeText = 'your scheduled time';

    if (!empty($consultation->consultation_date)) {
        $date = Carbon::parse($consultation->consultation_date, 'Asia/Manila');

        $dateText = $date->format('F j, Y');
        $timeText = $date->format('g:i A');
    }

    return
        "[Automated Text]\n\n" .
        "Hi {$name}!\n\n" .
        "This is a reminder for your appointment with RMTY on {$dateText} at {$timeText}.\n\n" .
        "Need to make changes?\n" .
        "Cancel: [link coming soon]\n" .
        "Reschedule: [link coming soon]\n\n" .
        "See you soon!\n\n" .
        "- RMTY Team\n" .
        "(This is an automated message. Please do not reply to this text.)";
}

/*
|--------------------------------------------------------------------------
| Automated Reminder Message
|--------------------------------------------------------------------------
| Used by Laravel Scheduler.
*/
public static function buildAutomatedReminderMessage($consultation): string
{
    $firstName = trim((string) ($consultation->first_name ?? ''));
    $name = $firstName !== '' ? $firstName : 'Client';

    $dateText = 'your scheduled date';
    $timeText = 'your scheduled time';

    if (!empty($consultation->consultation_date)) {
        $date = Carbon::parse($consultation->consultation_date, 'Asia/Manila');

        $dateText = $date->format('F j, Y');
        $timeText = $date->format('g:i A');
    }

    return
        "[Automated Text]\n\n" .
        "Hi {$name}!\n\n" .
        "This is a reminder for your appointment with RMTY on {$dateText} at {$timeText}.\n\n" .
        "Need to make changes?\n" .
        "Cancel: [link coming soon]\n" .
        "Reschedule: [link coming soon]\n\n" .
        "See you soon!\n\n" .
        "- RMTY Team\n" .
        "(This is an automated message. Please do not reply to this text.)";
}

    private static function formatNumber($number): string
    {
        $number = preg_replace('/\D/', '', (string) $number);

        if ($number === '') {
            return '';
        }

        // 09XXXXXXXXX → 639XXXXXXXXX
        if (str_starts_with($number, '09') && strlen($number) === 11) {
            return '63' . substr($number, 1);
        }

        // 9XXXXXXXXX → 639XXXXXXXXX
        if (str_starts_with($number, '9') && strlen($number) === 10) {
            return '63' . $number;
        }

        // 639XXXXXXXXX
        if (str_starts_with($number, '639') && strlen($number) === 12) {
            return $number;
        }

        return $number;
    }
}