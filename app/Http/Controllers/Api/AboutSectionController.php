<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AboutSection;
use App\Models\AdminActivity;
use Illuminate\Http\Request;

class AboutSectionController extends Controller
{
    public function index()
    {
        return AboutSection::where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function adminIndex()
    {
        return AboutSection::orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'content' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        if (!isset($data['is_published'])) {
            $data['is_published'] = true;
        }
        if (!array_key_exists('sort_order', $data)) {
            $max = AboutSection::max('sort_order');
            $data['sort_order'] = is_null($max) ? 0 : $max + 1;
        }

        if ($request->hasFile('cover_image')) {
            $data['image'] = $request->file('cover_image')->store('about', 'public');
        }

        unset($data['cover_image']);
        $section = AboutSection::create($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'subject_type' => 'about_section',
                'subject_id' => $section->id,
                'subject_title' => $section->title,
            ]);
        }

        return response()->json($section, 201);
    }

    public function update(Request $request, $id)
    {
        $section = AboutSection::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|required|string',
            'content' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        if ($request->hasFile('cover_image')) {
            $data['image'] = $request->file('cover_image')->store('about', 'public');
        }

        unset($data['cover_image']);
        $title = $section->title;
        $section->update($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'subject_type' => 'about_section',
                'subject_id' => $section->id,
                'subject_title' => $section->title ?? $title,
            ]);
        }

        return response()->json($section);
    }

    public function destroy(Request $request, $id)
    {
        $section = AboutSection::findOrFail($id);
        $title = $section->title;
        $section->delete();

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'deleted',
                'subject_type' => 'about_section',
                'subject_id' => (int) $id,
                'subject_title' => $title,
            ]);
        }

        return response()->json(['message' => 'Deleted']);
    }
}
