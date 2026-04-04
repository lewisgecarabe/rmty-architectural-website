<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContactPageContentController extends Controller
{
    public function index()
    {
        $content = ContactContent::first();

        if (!$content) {
            $content = ContactContent::create([
                'page_heading'     => 'Connect',
                'page_description' => 'At vero eos et accusamus et iusto odio dignissimos',
                'location_label'   => 'Metro Manila',
                'address_line_1'   => '911 Josefina II, Sampaloc, Manila, 1008',
                'address_line_2'   => 'Metro Manila',
                'office_day_from'  => 'Monday',
                'office_day_to'    => 'Friday',
                'office_time_from' => '09:00',
                'office_time_to'   => '18:00',
                'phone'            => '0932 454 9434',
                'email'            => 'rmty.architects@gmail.com',
            ]);
        }

        return response()->json(['data' => $content]);
    }

    public function store(Request $request)
    {
        $content = ContactContent::first() ?? new ContactContent();

        $validated = $request->validate([
            'page_heading'     => 'nullable|string|max:255',
            'page_description' => 'nullable|string',
            'location_label'   => 'nullable|string|max:255',
            'address_line_1'   => 'nullable|string|max:255',
            'address_line_2'   => 'nullable|string|max:255',
            'office_day_from'  => 'nullable|string|max:255',
            'office_day_to'    => 'nullable|string|max:255',
            'office_time_from' => 'nullable|string|max:255',
            'office_time_to'   => 'nullable|string|max:255',
            'phone'            => 'nullable|string|max:255',
            'email'            => 'nullable|email|max:255',
            'hero_image'       => 'nullable',
        ]);

        $content->fill($validated);

        if ($request->hasFile('hero_image')) {
            if ($content->hero_image && Storage::disk('public')->exists($content->hero_image)) {
                Storage::disk('public')->delete($content->hero_image);
            }
            $content->hero_image = $request->file('hero_image')->store('contact-content', 'public');
        } elseif ($request->input('hero_image') === 'REMOVE') {
            if ($content->hero_image && Storage::disk('public')->exists($content->hero_image)) {
                Storage::disk('public')->delete($content->hero_image);
            }
            $content->hero_image = null;
        }

        $content->save();

        return response()->json([
            'message' => 'Contact page content saved successfully.',
            'data'    => $content,
        ]);
    }
}