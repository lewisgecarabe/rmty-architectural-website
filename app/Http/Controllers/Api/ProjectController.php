<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    // READ ALL
    public function index()
    {
         return Project::with('category')
        ->where('is_published', true)
        ->latest()
        ->get();
    }

    // READ SINGLE
    public function show($slug)
    {
        return Project::where('slug', $slug)->firstOrFail();
    }

    // CREATE
    public function store(Request $request)
{
    $data = $request->validate([
        'title' => 'required|string',
        'category_id' => 'required|exists:categories,id',
        'location' => 'nullable|string',
        'description' => 'nullable|string',
        'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp',
        'is_published' => 'boolean'
    ]);

    $data['slug'] = Str::slug($data['title']);

    // Handle image upload
    if ($request->hasFile('cover_image')) {
        $path = $request->file('cover_image')->store('projects', 'public');
        $data['image'] = $path; // save into DB column
    }

    $project = Project::create($data);

    return response()->json($project, 201);
}



    
    // UPDATE
    public function update(Request $request, $id)
{
    $project = Project::findOrFail($id);

    $data = $request->validate([
        'title' => 'required|string',
        'category_id' => 'required|exists:categories,id',
        'location' => 'nullable|string',
        'description' => 'nullable|string',
        'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp',
        'is_published' => 'boolean'
    ]);

    if (isset($data['title'])) {
        $data['slug'] = Str::slug($data['title']);
    }

    if ($request->hasFile('cover_image')) {
        $path = $request->file('cover_image')->store('projects', 'public');
        $data['image'] = $path;
    }

    $project->update($data);

    return response()->json($project);
}


    // DELETE
    public function destroy($id)
    {
        Project::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
