<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\SmsController;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingConfirmationMail;

class ConsultationController extends Controller
{
    // GET /api/admin/consultations  (protected - admin)
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

    // GET /api/consultations/my  (protected - client)
    // Returns the authenticated user's latest active consultation
    public function my(Request $request): JsonResponse
    {
        $user = $request->user();

        $active = Consultation::where('email', $user->email)
            ->whereIn('status', ['pending', 'accepted', 'rescheduled'])
            ->where('is_published', true)
            ->latest('created_at')
            ->first();

        return response()->json([
            'has_active' => $active !== null,
            'consultation' => $active,
        ]);
    }

    // POST /api/consultations  (protected - client)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'        => 'required|string|max:100',
            'last_name'         => 'required|string|max:100',
            'email'             => 'required|email|max:255',
    'phone'      => ['required', 'regex:/^09\d{9}$/'],
            'location'          => 'nullable|string|max:255',
            'project_type'      => 'nullable|string|max:100',
            'message'           => 'nullable|string|max:5000',
            'consultation_date' => 'nullable|date',
        ]);

        // ── Block if user already has an ongoing consultation ─────────────
        $ongoing = Consultation::where('email', $validated['email'])
            ->whereIn('status', ['pending', 'accepted', 'rescheduled'])
            ->where('is_published', true)
            ->first();

        if ($ongoing) {
            return response()->json([
                'message'      => 'You already have an ongoing consultation.',
                'has_active'   => true,
                'consultation' => $ongoing,
            ], 409); // 409 Conflict
        }

        $consultation = Consultation::create([
            ...$validated,
            'status'            => 'pending',
            'is_published'      => true,
            'reschedule_reason' => null,
        ]);

        // Send booking confirmation email to client
        Mail::to($consultation->email)
            ->send(new BookingConfirmationMail($consultation));

        return response()->json($consultation, 201);
    }

    // PUT /api/consultations/{id}  (protected - admin)
    public function update(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);

        $validated = $request->validate([
            'is_published'      => 'sometimes|boolean',
            'status'            => 'sometimes|in:pending,accepted,cancelled,rescheduled,archived',
            'consultation_date' => 'sometimes|nullable|date',
            'reschedule_reason' => 'sometimes|nullable|string|max:1000',
        ]);

        $oldStatus = $consultation->status;
        $smsSent   = false;

        $consultation->fill($validated);

        if (array_key_exists('is_published', $validated) && (int) $validated['is_published'] === 0) {
            $consultation->status = 'archived';
        }

        if (
            array_key_exists('is_published', $validated) &&
            (int) $validated['is_published'] === 1 &&
            (!array_key_exists('status', $validated) || $validated['status'] === 'archived')
        ) {
            $consultation->status = 'pending';
        }

        $consultation->save();

        $statusChanged = $oldStatus !== $consultation->status;

        if (
            $statusChanged &&
            in_array($consultation->status, ['accepted', 'cancelled', 'rescheduled'], true) &&
            !empty($consultation->phone)
        ) {
            $message = $this->buildSmsMessage($consultation);
            $smsSent = SmsController::send($consultation->phone, $message);
        }

        return response()->json([
            'message'  => 'Consultation updated successfully.',
            'sms_sent' => $smsSent,
            'data'     => $consultation->fresh(),
        ]);
    }

    // DELETE /api/consultations/{id}  (protected - admin)
    public function destroy(int $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);
        $consultation->delete();

        return response()->json(['message' => 'Consultation deleted.']);
    }

    private function buildSmsMessage(Consultation $consultation): string
    {
        $name        = trim(($consultation->first_name ?? '') . ' ' . ($consultation->last_name ?? ''));
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
        if (empty($date)) return null;
        try {
            return Carbon::parse($date)->format('F j, Y g:i A');
        } catch (\Throwable $e) {
            return null;
        }
    }
    // Add this method to ConsultationController.php
// Route: GET /api/consultations/my-all  (auth:sanctum)

public function myAll(Request $request): JsonResponse
{
    $user = $request->user();

    $consultations = Consultation::where('email', $user->email)
        ->where('is_published', true)
        ->latest('created_at')
        ->get();

    return response()->json([
        'consultations' => $consultations,
    ]);
}
}

