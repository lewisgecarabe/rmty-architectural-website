<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SmsWebhookController extends Controller
{
    public function handle(Request $request)
{
    // Add this temporary line to see what the iPhone is REALLY sending:
    \Log::info('iPhone Data:', $request->all());

    $inquiry = Inquiry::create([
        'platform' => 'sms',
        'phone'    => $request->input('from'),
        'message' => $request->input('text') ?? 'No message content provided',
        'status'   => 'new',
        'raw_payload' => $request->all(),
    ]);

    return response()->json(['status' => 'success'], 201);
}
}