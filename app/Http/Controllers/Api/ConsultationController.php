<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingCancelledMail;
use App\Mail\BookingRescheduledMail;

class ConsultationController extends Controller
{
    // GET /api/admin/consultations  (admin)
    public function index(Request $request): JsonResponse
    {
        $query = Consultation::latest();

        // Allow searching by reference_id or client name/email from admin panel
        if ($search = $request->query('search')) {
            $query->search($search);
        }

        return response()->json($query->get());
    }

    // POST /api/consultations  (client — auto-accepts + sends confirmation email)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'email'             => 'required|email|max:255',
            'phone'             => 'nullable|string|max:30',
            'project_type'      => 'nullable|string|max:255',
            'location'          => 'nullable|string|max:255',
            'consultation_date' => 'nullable|date',
            'message'           => 'nullable|string',
        ]);

        // ── Block if user already has an active consultation ──────────────
        $ongoing = Consultation::where('email', $validated['email'])
            ->whereIn('status', ['pending', 'accepted', 'rescheduled'])
            ->where('is_published', 1)
            ->first();

        if ($ongoing) {
            return response()->json([
                'message'      => 'You already have an ongoing consultation.',
                'has_active'   => true,
                'consultation' => $ongoing,
            ], 409);
        }

        // ── Create as ACCEPTED immediately (reference_id auto-generated) ──
        $consultation = Consultation::create([
            ...$validated,
            'status'            => 'accepted',
            'is_published'      => 1,
            'reschedule_reason' => null,
        ]);

        // ── Send booking confirmation email ───────────────────────────────
        try {
            Mail::to($consultation->email)
                ->send(new BookingConfirmationMail($consultation));
        } catch (\Throwable $e) {
            Log::error('BookingConfirmationMail failed: ' . $e->getMessage());
        }

        return response()->json([
            'message'      => 'Consultation submitted successfully.',
            'data'         => $consultation,
            'reference_id' => $consultation->reference_id,   // ← NEW
        ], 201);
    }

    // GET /api/consultations/{id}
    public function show($id): JsonResponse
    {
        return response()->json(Consultation::findOrFail($id));
    }

    // GET /api/consultations/ref/{referenceId}  ← NEW: look up by reference ID
    public function showByReference(string $referenceId): JsonResponse
    {
        $consultation = Consultation::where('reference_id', strtoupper($referenceId))
            ->firstOrFail();

        return response()->json($consultation);
    }

    // PUT /api/consultations/{id}  (admin — sends email on cancel/reschedule)
    public function update(Request $request, $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);

        $validated = $request->validate([
            'first_name'        => 'sometimes|string|max:255',
            'last_name'         => 'sometimes|string|max:255',
            'email'             => 'sometimes|email|max:255',
            'phone'             => 'sometimes|nullable|string|max:30',
            'project_type'      => 'sometimes|nullable|string|max:255',
            'location'          => 'sometimes|nullable|string|max:255',
            'consultation_date' => 'sometimes|nullable|date',
            'message'           => 'sometimes|nullable|string',
            'status'            => 'sometimes|string|in:pending,accepted,cancelled,rescheduled,archived',
            'is_published'      => 'sometimes|boolean',
            'reschedule_reason' => 'sometimes|nullable|string|max:1000',
        ]);

        $oldStatus = strtolower((string) $consultation->status);

        $consultation->fill($validated);
        $consultation->save();
        $consultation->refresh();

        $newStatus = strtolower((string) $consultation->status);
        $smsSent   = null;

        // ── Send email when admin cancels or reschedules ──────────────────
        if ($oldStatus !== $newStatus) {

            if ($newStatus === 'cancelled') {
                try {
                    Mail::to($consultation->email)
                        ->send(new BookingCancelledMail($consultation));
                } catch (\Throwable $e) {
                    Log::error('BookingCancelledMail failed: ' . $e->getMessage());
                }
            }

            if ($newStatus === 'rescheduled') {
                try {
                    Mail::to($consultation->email)
                        ->send(new BookingRescheduledMail($consultation));
                } catch (\Throwable $e) {
                    Log::error('BookingRescheduledMail failed: ' . $e->getMessage());
                }
            }

            // ── SMS (existing behaviour) ──────────────────────────────────
            if (
                in_array($newStatus, ['accepted', 'cancelled', 'rescheduled'], true) &&
                !empty($consultation->phone)
            ) {
                try {
                    $smsMessage = SmsController::buildBookingStatusMessage($consultation, $newStatus);
                    $smsSent    = SmsController::send($consultation->phone, $smsMessage);
                } catch (\Throwable $e) {
                    Log::error('SMS failed: ' . $e->getMessage());
                    $smsSent = false;
                }
            }
        }

        return response()->json([
            'message'      => 'Consultation updated successfully.',
            'data'         => $consultation,
            'reference_id' => $consultation->reference_id,   // ← NEW
            'sms_sent'     => $smsSent,
            'old_status'   => $oldStatus,
            'new_status'   => $newStatus,
        ]);
    }

    // DELETE /api/consultations/{id}
    public function destroy($id): JsonResponse
    {
        Consultation::findOrFail($id)->delete();
        return response()->json(['message' => 'Consultation deleted successfully.']);
    }

    // GET /api/consultations/my  (client — active only)
    public function my(Request $request): JsonResponse
    {
        $user = $request->user();

        $active = Consultation::where('email', $user->email)
            ->whereIn('status', ['pending', 'accepted', 'rescheduled'])
            ->where('is_published', 1)
            ->latest()
            ->first();

        return response()->json([
            'has_active'   => $active !== null,
            'consultation' => $active,
        ]);
    }

    // GET /api/consultations/my-all  (client — full history)
    public function myAll(Request $request): JsonResponse
    {
        $user = $request->user();

        $consultations = Consultation::where('email', $user->email)
            ->latest()
            ->get();

        return response()->json(['consultations' => $consultations]);
    }
}