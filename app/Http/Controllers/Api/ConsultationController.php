<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ConsultationController extends Controller
{
    // ── PUBLIC: Client submits consultation ──────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'email'             => 'required|email|max:255',
            'phone'             => 'required|string|size:11',
            'location'          => 'required|string|max:255',
            'project_type'      => 'required|string|max:255',
            'project_details'   => 'required|string',
            'consultation_date' => 'required|date',
            'files.*'           => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $filePaths = [];

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('consultations', 'public');
                $filePaths[] = Storage::url($path);
            }
        }

        $consultation = Consultation::create([
            'first_name'        => $validated['first_name'],
            'last_name'         => $validated['last_name'],
            'email'             => $validated['email'],
            'phone'             => $validated['phone'],
            'location'          => $validated['location'],
            'project_type'      => $validated['project_type'],
            'project_details'   => $validated['project_details'],
            'consultation_date' => $validated['consultation_date'],
            'file_paths'        => !empty($filePaths) ? $filePaths : null,
            'status'            => 'pending',
            'is_viewed'         => false,
        ]);

        return response()->json([
            'message'      => 'Consultation submitted successfully.',
            'consultation' => $consultation,
        ], 201);
    }

    // ── ADMIN: List all consultations ────────────────────────────────
    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = Consultation::latest();

        if ($status === 'archived') {
            $query->where('status', 'archived');
        } else {
            $query->where('status', '!=', 'archived');
        }

        $consultations = $query->paginate(6);

        return response()->json($consultations);
    }

    // ── ADMIN: View single consultation ──────────────────────────────
    public function show(Consultation $consultation)
    {
        if (!$consultation->is_viewed) {
            $consultation->update(['is_viewed' => true]);
        }

        return response()->json($consultation);
    }

    // ── ADMIN: Update status (accept / decline / archive) ────────────
    public function updateStatus(Request $request, Consultation $consultation)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,declined,archived',
        ]);

        $consultation->update(['status' => $validated['status']]);

        return response()->json([
            'message'      => 'Status updated.',
            'consultation' => $consultation,
        ]);
    }

    // ── ADMIN: Mark as viewed ────────────────────────────────────────
    public function markViewed(Consultation $consultation)
    {
        $consultation->update(['is_viewed' => true]);

        return response()->json(['message' => 'Marked as viewed.']);
    }
}