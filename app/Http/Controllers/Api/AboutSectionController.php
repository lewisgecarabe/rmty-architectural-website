<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AboutSection;
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
        ]);

        if (!isset($data['is_published'])) {
            $data['is_published'] = true;
        }

        if ($request->hasFile('cover_image')) {
            $data['image'] = $request->file('cover_image')->store('about', 'public');
        }

        unset($data['cover_image']);
        $section = AboutSection::create($data);
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
        ]);

        if ($request->hasFile('cover_image')) {
            $data['image'] = $request->file('cover_image')->store('about', 'public');
        }

        unset($data['cover_image']);
        $section->update($data);
        return response()->json($section);
    }

    public function destroy($id)
    {
        AboutSection::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
