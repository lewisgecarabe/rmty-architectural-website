<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /** Public: only published, ordered */
    public function index()
    {
        return Service::where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /** Admin: all services */
    public function adminIndex()
    {
        return Service::orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'content' => 'nullable|string',
            'is_published' => 'sometimes|boolean',
        ]);

        if (!isset($data['is_published'])) {
            $data['is_published'] = true;
        }

        $service = Service::create($data);
        return response()->json($service, 201);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|required|string',
            'content' => 'nullable|string',
            'is_published' => 'sometimes|boolean',
        ]);

        $service->update($data);
        return response()->json($service);
    }

    public function destroy($id)
    {
        Service::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
