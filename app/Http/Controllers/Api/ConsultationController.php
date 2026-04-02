<?php

namespace App\Http\Controllers\Api;

use App\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultationController
{
    // GET /api/admin/consultations  (protected)
    public function index(Request $request): JsonResponse
    {
        $query = Consultation::query()->latest('created_at');

        if ($search = $request->query('search')) {
            $query->search($search);
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

        $consultation = Consultation::create($validated);

        return response()->json($consultation, 201);
    }

    // PUT /api/consultations/{id}  (protected — archive / restore)
    public function update(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);

        $validated = $request->validate([
            'is_published' => 'required|boolean',
        ]);

        $consultation->update(['is_published' => $validated['is_published']]);

        return response()->json($consultation->fresh());
    }

    // DELETE /api/consultations/{id}  (protected)
    public function destroy(int $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);
        $consultation->delete();

        return response()->json(['message' => 'Consultation deleted.']);
    }
}
