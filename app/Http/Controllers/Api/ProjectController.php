<?php
// app/Http/Controllers/Api/ProjectController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Project;
use App\Models\ProjectImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    // Public — only published
    public function index()
    {
        return Project::with(['category', 'images'])
            ->where('is_published', true)
            ->latest()
            ->get();
    }

    // Admin — all projects including archived
    public function adminIndex()
    {
        return Project::with(['category', 'images'])
            ->latest()
            ->get();
    }

    // Single project by slug
    public function show($slug)
    {
        return Project::with(['category', 'images'])
            ->where('slug', $slug)
            ->firstOrFail();
    }

    // CREATE
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'        => 'required|string',
            'category_id'  => 'required|exists:categories,id',
            'location'     => 'nullable|string',
            'description'  => 'nullable|string',
            // ✅ Increased to 20 MB for cover, 20 MB per gallery image
            'cover_image'  => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'gallery'      => 'nullable|array',
            'gallery.*'    => 'image|mimes:jpg,jpeg,png,webp|max:20480',
            'is_published' => 'sometimes|boolean',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['is_published'] = $data['is_published'] ?? true;

        // Cover image
        if ($request->hasFile('cover_image')) {
            $data['image'] = $request->file('cover_image')
                ->store('projects/covers', 'public');
        }

        // Remove non-column keys before creating
        unset($data['cover_image'], $data['gallery']);

        $project = Project::create($data);

        // Gallery images
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $index => $file) {
                $path = $file->store('projects/gallery', 'public');
                ProjectImage::create([
                    'project_id' => $project->id,
                    'image_path' => $path,
                    'sort_order' => $index,
                ]);
            }
        }

        $this->logActivity($request, 'created', $project);

        return response()->json(
            $project->load(['category', 'images']),
            201
        );
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $data = $request->validate([
            'title'        => 'sometimes|required|string',
            'category_id'  => 'sometimes|required|exists:categories,id',
            'location'     => 'nullable|string',
            'description'  => 'nullable|string',
            // ✅ Increased to 20 MB for cover, 20 MB per gallery image
            'cover_image'  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:20480',
            'gallery'      => 'nullable|array',
            'gallery.*'    => 'image|mimes:jpg,jpeg,png,webp|max:20480',
            'is_published' => 'sometimes|boolean',
        ]);

        if (isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        // Cover image — delete old one first
        if ($request->hasFile('cover_image')) {
            if ($project->image) {
                Storage::disk('public')->delete($project->image);
            }
            $data['image'] = $request->file('cover_image')
                ->store('projects/covers', 'public');
        }

        // Remove non-column keys before updating
        unset($data['cover_image'], $data['gallery']);

        $project->update($data);

        // Gallery — append new images (does NOT delete existing ones)
        if ($request->hasFile('gallery')) {
            $lastOrder = $project->images()->max('sort_order') ?? -1;

            foreach ($request->file('gallery') as $index => $file) {
                $path = $file->store('projects/gallery', 'public');
                ProjectImage::create([
                    'project_id' => $project->id,
                    'image_path' => $path,
                    'sort_order' => $lastOrder + $index + 1,
                ]);
            }
        }

        $this->logActivity($request, 'updated', $project);

        return response()->json($project->load(['category', 'images']));
    }

    // DELETE
    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $title = $project->title;

        // Clean up stored files
        if ($project->image) {
            Storage::disk('public')->delete($project->image);
        }
        foreach ($project->images as $img) {
            Storage::disk('public')->delete($img->image_path);
        }

        $project->delete(); // cascade deletes project_images rows

        $this->logActivity($request, 'deleted', $project, $id, $title);

        return response()->json(['message' => 'Deleted']);
    }

    // DELETE SINGLE GALLERY IMAGE
    public function deleteGalleryImage(Request $request, $id, $imageId)
    {
        $project = Project::findOrFail($id);
        $image   = ProjectImage::where('id', $imageId)
                    ->where('project_id', $project->id)
                    ->firstOrFail();

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        $this->logActivity($request, 'updated', $project);

        return response()->json(['message' => 'Gallery image deleted']);
    }

    // GET /api/settings/projects-cta  (public)
    public function getProjectsCta()
    {
        $image = DB::table('settings')->where('key', 'projects_cta_image')->value('value');
        $text  = DB::table('settings')->where('key', 'projects_cta_text')->value('value');

        return response()->json([
            'image' => $image ? Storage::url($image) : null,
            'text'  => $text ?? '',
        ]);
    }

    // POST /api/admin/settings/projects-cta  (admin)
    public function updateProjectsCta(Request $request)
    {
        $request->validate([
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:20480',
            'text'  => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $old = DB::table('settings')->where('key', 'projects_cta_image')->value('value');
            if ($old) Storage::disk('public')->delete($old);

            $path = $request->file('image')->store('settings', 'public');
            DB::table('settings')->updateOrInsert(
                ['key' => 'projects_cta_image'],
                ['value' => $path]
            );
        }

        if ($request->has('text')) {
            DB::table('settings')->updateOrInsert(
                ['key' => 'projects_cta_text'],
                ['value' => $request->text]
            );
        }

        return response()->json(['message' => 'Saved']);
    }

    // Helper to reduce repetition
    private function logActivity(Request $request, string $action, $project, $id = null, $title = null): void
    {
        if ($request->user()) {
            AdminActivity::create([
                'user_id'       => $request->user()->id,
                'action'        => $action,
                'subject_type'  => 'project',
                'subject_id'    => $id ?? $project->id,
                'subject_title' => $title ?? $project->title,
            ]);
        }
    }
}