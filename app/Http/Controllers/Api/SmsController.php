<?php

namespace App\Http\Controllers\Api;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsController
{
    public static function send($number, $message)
    {
        $url        = env('SMS_API_URL');
        $apiKey     = env('SMS_API_KEY');
        $senderName = env('SMS_SENDER_NAME');

        if (empty($url) || empty($apiKey)) {
            Log::warning('SMS not sent because SMS configuration is missing.', [
                'phone'       => $number,
                'has_url'     => !empty($url),
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
            'apikey'  => $apiKey,
            'number'  => $formattedNumber,
            'message' => $message,
        ];

        if (!empty($senderName)) {
            $payload['sendername'] = $senderName;
        }

        try {
            Log::info('Sending SMS request.', [
                'url'              => $url,
                'original_number'  => $number,
                'formatted_number' => $formattedNumber,
                'message'          => $message,
                'sender_name'      => $senderName ?: null,
            ]);

            $response = Http::asForm()
                ->timeout(20)
                ->post($url, $payload);

            Log::info('SMS API response received.', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            if (!$response->successful()) {
                Log::error('SMS API request failed.', [
                    'phone'    => $formattedNumber,
                    'status'   => $response->status(),
                    'response' => $response->body(),
                ]);
                return false;
            }

            $data = $response->json();

            // Semaphore returns an array of message objects
            if (!is_array($data) || empty($data)) {
                Log::warning('SMS API returned unexpected response format.', [
                    'response' => $data,
                ]);
                return false;
            }

            // The first element may be the message object directly
            $first = isset($data[0]) ? $data[0] : $data;

            $smsStatus = strtolower($first['status'] ?? '');

            $successStatuses = ['pending', 'queued', 'sent', 'success'];

            if (in_array($smsStatus, $successStatuses, true)) {
                Log::info('SMS accepted by provider.', [
                    'phone'      => $formattedNumber,
                    'message_id' => $first['message_id'] ?? null,
                    'status'     => $first['status'] ?? null,
                ]);
                return true;
            }

            Log::warning('SMS was not accepted by provider.', [
                'phone'           => $formattedNumber,
                'provider_status' => $first['status'] ?? null,
                'response'        => $data,
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

    public static function buildBookingStatusMessage($consultation, $status = 'accepted')
    {
        $firstName = trim($consultation->first_name ?? '');
        $name      = $firstName !== '' ? $firstName : 'Client';

        $dashboardLink = self::dashboardLink();

        $dateText = 'your selected date';
        $timeText = 'your selected time';
        $dayLabel = 'your consultation';

        if (!empty($consultation->consultation_date)) {
            // Strip timezone so Carbon treats it as local time
            $raw  = preg_replace('/(\.\d+)?Z$/i', '', str_replace(' ', 'T', (string) $consultation->consultation_date));
            $raw  = preg_replace('/[+-]\d{2}:\d{2}$/', '', $raw);
            $date = Carbon::parse($raw);

            $timeText = $date->format('g:i A');

            if ($date->isToday()) {
                $dateText = 'today';
                $dayLabel = 'today';
            } elseif ($date->isTomorrow()) {
                $dateText = 'tomorrow';
                $dayLabel = 'tomorrow';
            } else {
                $formatted = $date->format('F j, Y');
                $dateText  = 'on ' . $formatted;
                $dayLabel  = 'on ' . $formatted;
            }
        }

        $status = strtolower(trim($status));

        if ($status === 'cancelled') {
            return
                "Hi {$name}!\n" .
                "Your architecture consultation has been cancelled.\n" .
                "If you'd like to book a new session or need assistance, visit your dashboard:\n" .
                "{$dashboardLink}\n" .
                "We hope to hear from you soon!";
        }

        if ($status === 'rescheduled') {
            return
                "Hi {$name}!\n" .
                "Your architecture consultation has been rescheduled to {$dateText} at {$timeText}.\n" .
                "We're excited to hear about your project and get started with you.\n" .
                "Need to reschedule? You can do it here:\n" .
                "{$dashboardLink}\n" .
                "See you {$dayLabel}!";
        }

        // accepted / default
        return
            "Hi {$name}!\n" .
            "Just a quick reminder that your architecture consultation is happening {$dateText} at {$timeText}.\n" .
            "We're excited to hear about your project and get started with you.\n" .
            "Need to reschedule? You can do it here:\n" .
            "{$dashboardLink}\n" .
            "See you {$dayLabel}!";
    }

    private static function dashboardLink(): string
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', env('APP_URL')), '/');
        return $frontendUrl . '/user/dashboard';
    }

    private static function formatNumber($number): string
    {
        // Strip everything that isn't a digit
        $number = preg_replace('/\D/', '', (string) $number);

        if ($number === '') {
            return '';
        }

        // 09XXXXXXXXX  → 639XXXXXXXXX
        if (str_starts_with($number, '09') && strlen($number) === 11) {
            return '63' . substr($number, 1);
        }

        // 9XXXXXXXXX (10 digits, no leading 0) → 639XXXXXXXXX
        if (str_starts_with($number, '9') && strlen($number) === 10) {
            return '63' . $number;
        }

        // Already 639XXXXXXXXX
        if (str_starts_with($number, '639') && strlen($number) === 12) {
            return $number;
        }

        // Return as-is and let Semaphore reject it if invalid
        return $number;
    }
}