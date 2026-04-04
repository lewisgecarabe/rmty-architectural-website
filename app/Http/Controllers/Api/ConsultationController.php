<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\SmsController;


class ConsultationController extends Controller
{
    // GET /api/admin/consultations  (protected)
    public function index(Request $request): JsonResponse
    {
        $query = Consultation::query()->latest('created_at');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('project_type')) {
            $query->where('project_type', $type);
        }

        return response()->json($query->get());
    }

    // POST /api/consultations  (public — contact form submission)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'        => 'required|string|max:100',
            'last_name'         => 'required|string|max:100',
            'email'             => 'required|email|max:255',
            'phone'             => 'nullable|string|max:20',
            'location'          => 'nullable|string|max:255',
            'project_type'      => 'nullable|string|max:100',
            'message'           => 'nullable|string|max:5000',
            'consultation_date' => 'nullable|date',
        ]);

        $consultation = Consultation::create([
            ...$validated,
            'status' => 'pending',
            'is_published' => true,
            'reschedule_reason' => null,
        ]);

        return response()->json($consultation, 201);
    }

    // PUT /api/consultations/{id}  (protected — accept / cancel / reschedule / archive / restore)
    public function update(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);

        $validated = $request->validate([
            'is_published'       => 'sometimes|boolean',
            'status'             => 'sometimes|in:pending,accepted,cancelled,rescheduled,archived',
            'consultation_date'  => 'sometimes|nullable|date',
            'reschedule_reason'  => 'sometimes|nullable|string|max:1000',
        ]);

        $oldStatus = $consultation->status;
        $smsSent = false;

        $consultation->fill($validated);

        // If archived, force archived state
        if (array_key_exists('is_published', $validated) && (int) $validated['is_published'] === 0) {
            $consultation->status = 'archived';
        }

        // If restored without explicit status, bring it back as pending
        if (
            array_key_exists('is_published', $validated) &&
            (int) $validated['is_published'] === 1 &&
            (!array_key_exists('status', $validated) || $validated['status'] === 'archived')
        ) {
            $consultation->status = 'pending';
        }

        $consultation->save();

        $statusChanged = $oldStatus !== $consultation->status;

        // Send SMS only for accepted / cancelled / rescheduled
        if (
            $statusChanged &&
            in_array($consultation->status, ['accepted', 'cancelled', 'rescheduled'], true) &&
            !empty($consultation->phone)
        ) {
            $message = $this->buildSmsMessage($consultation);
            $smsSent = SmsController::send($consultation->phone, $message);
        }

        return response()->json([
            'message' => 'Consultation updated successfully.',
            'sms_sent' => $smsSent,
            'data' => $consultation->fresh(),
        ]);
    }

    // DELETE /api/consultations/{id}  (protected)
    public function destroy(int $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);
        $consultation->delete();

        return response()->json([
            'message' => 'Consultation deleted.',
        ]);
    }

    private function buildSmsMessage(Consultation $consultation): string
    {
        $name = trim(($consultation->first_name ?? '') . ' ' . ($consultation->last_name ?? ''));
        $displayName = $name !== '' ? $name : 'Client';

        $formattedDate = $this->formatConsultationDate($consultation->consultation_date);

        switch ($consultation->status) {
            case 'accepted':
                return $formattedDate
                    ? "RMTY Architecture:\nHi {$displayName}, your consultation is CONFIRMED on {$formattedDate}.\n\nWe look forward to discussing your project."
                    : "RMTY Architecture:\nHi {$displayName}, your consultation has been CONFIRMED.";

            case 'cancelled':
                return "RMTY Architecture:\nHi {$displayName}, your consultation has been CANCELLED.\n\nYou may book again anytime.";

            case 'rescheduled':
                $message = $formattedDate
                    ? "RMTY Architecture:\nHi {$displayName}, your consultation has been RESCHEDULED to {$formattedDate}."
                    : "RMTY Architecture:\nHi {$displayName}, your consultation has been RESCHEDULED.";

                if (!empty($consultation->reschedule_reason)) {
                    $message .= "\n\nNote: {$consultation->reschedule_reason}";
                }

                return $message;

            default:
                return "RMTY Architecture:\nHi {$displayName}, your booking status has been updated.";
        }
    }

    private function formatConsultationDate($date): ?string
    {
        if (empty($date)) {
            return null;
        }

        try {
            return Carbon::parse($date)->format('F j, Y g:i A');
        } catch (\Throwable $e) {
            return null;
        }
    }
}