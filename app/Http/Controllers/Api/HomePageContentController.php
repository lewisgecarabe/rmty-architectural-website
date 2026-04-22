<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Home;
use Illuminate\Support\Str;

class HomePageContentController extends Controller
{
    // Fetches the data for the React frontend
    public function index()
    {
        $content = Home::first() ?? new Home();

        $defaultFeaturedDescription = 'RMTY approaches each project with a balance of architectural clarity and practical execution. Our featured works demonstrate how we translate site context, client goals, and technical requirements into spaces that are purposeful and enduring.';

        if (
            !empty($content->featured_description) &&
            Str::contains($content->featured_description, ['At vero eos', 'Lorem ipsum', 'blanditiis praesentium'])
        ) {
            $content->featured_description = $defaultFeaturedDescription;
            $content->save();
        }

        return response()->json(['data' => $content]);
    }

    // Saves the data from the React frontend
    public function store(Request $request)
    {
        $content = Home::first() ?? new Home();

        // 1. Update Text Fields
        foreach ($request->except(['hero_image_1', 'hero_image_2', 'hero_image_3', 'contact_image']) as $key => $value) {
            $content->$key = $value ?? '';
        }

        $images = ['hero_image_1', 'hero_image_2', 'hero_image_3', 'contact_image'];
        
        foreach ($images as $field) {
            if ($request->hasFile($field)) {
                // Save the new image
                $content->$field = $request->file($field)->store('home-contents', 'public');
            } elseif ($request->input($field) === 'REMOVE') {
                // The explicit REMOVE command bypasses Laravel's middleware!
                $content->$field = ''; 
            }
        }

        $content->save();
        return response()->json(['message' => 'Saved', 'data' => $content]);
    }
}