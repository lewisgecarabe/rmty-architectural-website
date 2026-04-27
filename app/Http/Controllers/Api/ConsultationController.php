<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ConsultationController extends Controller
{
    public function index()
    {
        $consultations = Consultation::latest()->get();

        return response()->json($consultations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'project_type' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'consultation_date' => 'nullable|date',
            'message' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $consultation = Consultation::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'project_type' => $validated['project_type'] ?? null,
            'location' => $validated['location'] ?? null,
            'consultation_date' => $validated['consultation_date'] ?? null,
            'message' => $validated['message'] ?? null,
            'content' => $validated['content'] ?? null,
            'status' => 'pending',
            'is_published' => 1,
        ]);

        return response()->json([
            'message' => 'Consultation submitted successfully.',
            'data' => $consultation,
        ], 201);
    }

    public function show($id)
    {
        $consultation = Consultation::findOrFail($id);

        return response()->json($consultation);
    }

    public function update(Request $request, $id)
    {
        $consultation = Consultation::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|nullable|string|max:30',
            'project_type' => 'sometimes|nullable|string|max:255',
            'location' => 'sometimes|nullable|string|max:255',
            'consultation_date' => 'sometimes|nullable|date',
            'message' => 'sometimes|nullable|string',
            'content' => 'sometimes|nullable|string',
            'status' => 'sometimes|string|in:pending,accepted,cancelled,rescheduled,archived',
            'is_published' => 'sometimes|boolean',
            'reschedule_reason' => 'sometimes|nullable|string|max:1000',
        ]);

        $oldStatus = strtolower((string) $consultation->status);

        $consultation->fill($validated);
        $consultation->save();
        $consultation->refresh();

        $newStatus = strtolower((string) $consultation->status);

        $smsSent = null;

        $shouldSendSms = in_array($newStatus, [
            'accepted',
            'cancelled',
            'rescheduled',
        ], true);

        if ($shouldSendSms) {
            if (!empty($consultation->phone)) {
                $message = SmsController::buildBookingStatusMessage(
                    $consultation,
                    $newStatus
                );

                $smsSent = SmsController::send(
                    $consultation->phone,
                    $message
                );

                Log::info('Consultation SMS attempt finished.', [
                    'consultation_id' => $consultation->id,
                    'phone' => $consultation->phone,
                    'status' => $newStatus,
                    'sms_sent' => $smsSent,
                ]);
            } else {
                $smsSent = false;

                Log::warning('Consultation SMS not sent because phone number is missing.', [
                    'consultation_id' => $consultation->id,
                    'status' => $newStatus,
                ]);
            }
        }

        return response()->json([
            'message' => 'Consultation updated successfully.',
            'data' => $consultation,
            'sms_sent' => $smsSent,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);
    }

    public function destroy($id)
    {
        $consultation = Consultation::findOrFail($id);

        $consultation->delete();

        return response()->json([
            'message' => 'Consultation deleted successfully.',
        ]);
    }

    public function my(Request $request)
    {
        $user = $request->user();

        $consultations = Consultation::where('email', $user->email)
            ->where('is_published', 1)
            ->latest()
            ->get();

        return response()->json($consultations);
    }

    public function myAll(Request $request)
    {
        $user = $request->user();

        $consultations = Consultation::where('email', $user->email)
            ->latest()
            ->get();

        return response()->json($consultations);
    }
}