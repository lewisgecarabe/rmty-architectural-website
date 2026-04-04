<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index()
    {
        return Service::where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function adminIndex()
    {
        return Service::orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $maxSort = Service::max('sort_order');
        $defaultSort = is_null($maxSort) ? 0 : $maxSort + 1;

        // THE FIX: ?? '' catches Laravel's nulls and forces them to be blank strings for MySQL!
        $data = [
            'title' => $request->input('title') ?? '',
            'content' => $request->input('content') ?? '',
            'is_published' => $request->has('is_published') ? $request->boolean('is_published') : true,
            'sort_order' => $request->input('sort_order') ?? $defaultSort,
        ];

        // Handle Optional Image Upload
        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|mimes:jpg,jpeg,png,webp']);
            $data['image'] = $request->file('cover_image')->store('services', 'public');
        }

        $service = Service::create($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'subject_type' => 'service',
                'subject_id' => $service->id,
                'subject_title' => $service->title !== '' ? $service->title : 'Service ' . $service->sort_order,
            ]);
        }

        return response()->json($service, 201);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        // THE FIX: ?? '' catches Laravel's nulls and forces them to be blank strings for MySQL!
        $data = [
            'title' => $request->input('title') ?? '',
            'content' => $request->input('content') ?? '',
            'is_published' => $request->has('is_published') ? $request->boolean('is_published') : $service->is_published,
            'sort_order' => $request->input('sort_order') ?? $service->sort_order,
        ];

        // Handle Image Upload / Removal
        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|mimes:jpg,jpeg,png,webp']);
            
            // Delete old image if it exists to save space
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            
            $data['image'] = $request->file('cover_image')->store('services', 'public');
            
        } elseif ($request->input('cover_image') === 'REMOVE') {
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $data['image'] = null; // Set to null in DB
        }

        $oldTitle = $service->title;
        $service->update($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'subject_type' => 'service',
                'subject_id' => $service->id,
                'subject_title' => $service->title !== '' ? $service->title : ($oldTitle !== '' ? $oldTitle : 'Service ' . $service->sort_order),
            ]);
        }

        return response()->json($service);
    }

    public function destroy(Request $request, $id)
    {
        $service = Service::findOrFail($id);
        $title = $service->title;
        
        // Delete image file when service is deleted
        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }
        
        $service->delete();

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'deleted',
                'subject_type' => 'service',
                'subject_id' => (int) $id,
                'subject_title' => $title !== '' ? $title : 'Service ' . $id,
            ]);
        }

        return response()->json(['message' => 'Deleted']);
    }
}