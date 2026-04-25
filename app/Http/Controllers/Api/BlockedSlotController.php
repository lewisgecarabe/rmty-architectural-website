<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlockedSlot;
use App\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockedSlotController extends Controller
{
    // GET /api/admin/blocked-slots  (admin — list all)
    public function index(Request $request): JsonResponse
    {
        $query = BlockedSlot::query()->orderBy('blocked_date')->orderBy('blocked_time');

        if ($from = $request->query('from')) {
            $query->where('blocked_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('blocked_date', '<=', $to);
        }

        return response()->json($query->get());
    }

    // POST /api/admin/blocked-slots  (admin — block one or more slots)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots'          => 'required|array|min:1',
            'slots.*.date'   => 'required|date',
            'slots.*.time'   => 'required|string|max:5',
            'slots.*.reason' => 'nullable|string|max:255',
        ]);

        $created = [];

        foreach ($validated['slots'] as $slot) {
            $created[] = BlockedSlot::firstOrCreate(
                [
                    'blocked_date' => $slot['date'],
                    'blocked_time' => $slot['time'],
                ],
                [
                    'reason' => $slot['reason'] ?? null,
                ]
            );
        }

        return response()->json([
            'message' => count($created) . ' slot(s) blocked.',
            'data'    => $created,
        ], 201);
    }

    // DELETE /api/admin/blocked-slots/{id}  (admin — unblock single)
    public function destroy(int $id): JsonResponse
    {
        $slot = BlockedSlot::findOrFail($id);
        $slot->delete();

        return response()->json(['message' => 'Slot unblocked.']);
    }

    // DELETE /api/admin/blocked-slots/by-date-time  (admin — unblock by date+time)
    public function destroyByDateTime(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|string|max:5',
        ]);

        $deleted = BlockedSlot::where('blocked_date', $validated['date'])
            ->where('blocked_time', $validated['time'])
            ->delete();

        return response()->json([
            'message' => $deleted ? 'Slot unblocked.' : 'Slot not found.',
        ]);
    }

    // GET /api/blocked-slots  (public — used by client calendar)
    public function publicIndex(Request $request): JsonResponse
    {
        $query = BlockedSlot::query()
            ->where('blocked_date', '>=', now()->toDateString())
            ->orderBy('blocked_date')
            ->orderBy('blocked_time');

        if ($from = $request->query('from')) {
            $query->where('blocked_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('blocked_date', '<=', $to);
        }

        $slots = $query->get(['blocked_date', 'blocked_time']);

        return response()->json($slots);
    }

    // GET /api/booked-slots  (public — active consultations date+time)
    public function bookedSlots(Request $request): JsonResponse
    {
        $consultations = Consultation::whereIn('status', ['pending', 'accepted', 'rescheduled'])
            ->where('is_published', true)
            ->whereNotNull('consultation_date')
            ->get(['id', 'first_name', 'last_name', 'email', 'phone', 'project_type', 'status', 'consultation_date']);

        $slots = $consultations->map(function ($c) {
            $dt = \Carbon\Carbon::parse($c->consultation_date);
            return [
                'blocked_date'  => $dt->toDateString(),
                'blocked_time'  => $dt->format('H:i'),
                'consultation_id' => $c->id,
                'client_name'   => trim($c->first_name . ' ' . $c->last_name),
                'email'         => $c->email,
                'phone'         => $c->phone,
                'project_type'  => $c->project_type,
                'status'        => $c->status,
            ];
        })->values();

        return response()->json($slots);
    }
}
