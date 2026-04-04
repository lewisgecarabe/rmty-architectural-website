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
            'title' => 'nullable|string', 
            'content' => 'nullable|string',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        // THE FIX: Intercept Laravel's NULLs and force them to empty strings for MySQL
        $data['title'] = $data['title'] ?? '';
        $data['content'] = $data['content'] ?? '';

        if (!isset($data['is_published'])) {
            $data['is_published'] = true;
        }
        if (!array_key_exists('sort_order', $data)) {
            $max = AboutSection::max('sort_order');
            $data['sort_order'] = is_null($max) ? 0 : $max + 1;
        }

        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|mimes:jpg,jpeg,png,webp']);
            $data['image'] = $request->file('cover_image')->store('about', 'public');
        }

        $section = AboutSection::create($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'subject_type' => 'about_section',
                'subject_id' => $section->id,
                'subject_title' => $section->title !== '' ? $section->title : 'Section ' . $section->sort_order,
            ]);
        }

        return response()->json($section, 201);
    }

    public function update(Request $request, $id)
    {
        $section = AboutSection::findOrFail($id);

        $data = $request->validate([
            'title' => 'nullable|string',
            'content' => 'nullable|string',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        // THE FIX: Intercept Laravel's NULLs and force them to empty strings for MySQL
        if (array_key_exists('title', $data)) {
            $data['title'] = $data['title'] ?? '';
        }
        if (array_key_exists('content', $data)) {
            $data['content'] = $data['content'] ?? '';
        }

        // Handle Image Logic
        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|mimes:jpg,jpeg,png,webp']);
            $data['image'] = $request->file('cover_image')->store('about', 'public');
            
        } elseif ($request->input('cover_image') === 'REMOVE') {
            // Because your DB might also hate NULL images, let's make sure it's an empty string!
            $data['image'] = ''; 
        }

        $oldTitle = $section->title;
        $section->update($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'subject_type' => 'about_section',
                'subject_id' => $section->id,
                'subject_title' => $section->title !== '' ? $section->title : ($oldTitle !== '' ? $oldTitle : 'Section ' . $section->sort_order),
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
                'subject_title' => $title !== '' ? $title : 'Section ' . $section->sort_order,
            ]);
        }

        return response()->json(['message' => 'Deleted']);
    }
}