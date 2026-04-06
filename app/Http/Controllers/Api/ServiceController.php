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
        $sortOrder = (int) ($request->input('sort_order') ?? 0);

        $maxSort = Service::max('sort_order');
        $defaultSort = is_null($maxSort) ? 0 : $maxSort + 1;

        $data = [
            'title' => $request->input('title') ?? '',
            'content' => $request->input('content') ?? '',
            'is_published' => $request->has('is_published') ? $request->boolean('is_published') : true,
            'sort_order' => $request->input('sort_order') ?? $defaultSort,
        ];

        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|mimes:jpg,jpeg,png,webp']);
            $data['image'] = $request->file('cover_image')->store('services', 'public');
        }

        // Prevent duplicate fixed sections: Hero, Intro, CTA
        if (in_array($sortOrder, [0, 1, 2], true)) {
            $existing = Service::where('sort_order', $sortOrder)->orderBy('id')->first();

            if ($existing) {
                if (array_key_exists('image', $data) && $existing->image) {
                    Storage::disk('public')->delete($existing->image);
                }

                $oldTitle = $existing->title;
                $existing->update($data);

                if ($request->user()) {
                    AdminActivity::create([
                        'user_id' => $request->user()->id,
                        'action' => 'updated',
                        'subject_type' => 'service',
                        'subject_id' => $existing->id,
                        'subject_title' => $existing->title !== '' ? $existing->title : ($oldTitle !== '' ? $oldTitle : 'Service ' . $existing->sort_order),
                    ]);
                }

                return response()->json($existing);
            }
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

        $data = [
            'title' => $request->input('title') ?? '',
            'content' => $request->input('content') ?? '',
            'is_published' => $request->has('is_published') ? $request->boolean('is_published') : $service->is_published,
            'sort_order' => $request->input('sort_order') ?? $service->sort_order,
        ];

        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|mimes:jpg,jpeg,png,webp']);

            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }

            $data['image'] = $request->file('cover_image')->store('services', 'public');
        } elseif ($request->input('cover_image') === 'REMOVE') {
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $data['image'] = null;
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