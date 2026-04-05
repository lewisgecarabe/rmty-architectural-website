<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Inquiry;
use App\Models\Consultation;
use App\Models\Project;
use App\Models\User;
use App\Models\AdminActivity;
use App\Models\Service;
use App\Models\Category;

class SearchController extends Controller
{
    public function globalSearch(Request $request)
    {
        $query = $request->query('q');
        $results = collect();

        if (!$query) {
            return response()->json([]);
        }

        // 1. Search Inquiries
        $inquiries = Inquiry::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->orWhere('message', 'LIKE', "%{$query}%")
            ->take(5)->get()->map(function ($item) {
                return [
                    'id' => 'inq_' . $item->id,
                    'type' => 'Inquiries',
                    'label' => $item->name . ' (' . Str::limit($item->message, 30) . ')',
                    'to' => '/admin/inquiries',
                    'icon' => '💬'
                ];
            });
        $results = $results->merge($inquiries);

        // 2. Search Consultations
        $consultations = Consultation::where('first_name', 'LIKE', "%{$query}%")
            ->orWhere('last_name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->take(5)->get()->map(function ($item) {
                return [
                    'id' => 'cons_' . $item->id,
                    'type' => 'Consultations',
                    'label' => $item->first_name . ' ' . $item->last_name . ' (' . $item->project_type . ')',
                    'to' => '/admin/consultations',
                    'icon' => '📅'
                ];
            });
        $results = $results->merge($consultations);

        // 3. Search Projects
        $projects = Project::where('title', 'LIKE', "%{$query}%")
            ->orWhere('location', 'LIKE', "%{$query}%")
            ->take(5)->get()->map(function ($item) {
                return [
                    'id' => 'proj_' . $item->id,
                    'type' => 'Projects',
                    'label' => $item->title,
                    'to' => '/admin/content/projects',
                    'icon' => '🏗️'
                ];
            });
        $results = $results->merge($projects);

        // 4. Search Users & Admins
        $users = User::where('name', 'LIKE', "%{$query}%")
            ->orWhere('first_name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->take(5)->get()->map(function ($item) {
                return [
                    'id' => 'user_' . $item->id,
                    'type' => 'Users & Admins',
                    'label' => $item->name . ' (' . $item->email . ')',
                    'to' => '/admin/users',
                    'icon' => '👥'
                ];
            });
        $results = $results->merge($users);

        // 5. Search Admin Activities (System Logs)
        $activities = AdminActivity::where('subject_title', 'LIKE', "%{$query}%")
            ->orWhere('action', 'LIKE', "%{$query}%")
            ->orWhere('subject_type', 'LIKE', "%{$query}%")
            ->take(5)->get()->map(function ($item) {
                return [
                    'id' => 'act_' . $item->id,
                    'type' => 'System Logs',
                    'label' => $item->action . ' ' . $item->subject_type . ': ' . Str::limit($item->subject_title, 20),
                    'to' => '/admin/dashboard', 
                    'icon' => '📋'
                ];
            });
        $results = $results->merge($activities);

        // 6. Search Services & Categories
        $services = Service::where('title', 'LIKE', "%{$query}%")->take(3)->get()->map(function ($item) {
            return ['id' => 'srv_'.$item->id, 'type' => 'Services', 'label' => $item->title, 'to' => '/admin/content/services', 'icon' => '✨'];
        });
        $categories = Category::where('name', 'LIKE', "%{$query}%")->take(3)->get()->map(function ($item) {
            return ['id' => 'cat_'.$item->id, 'type' => 'Categories', 'label' => $item->name, 'to' => '/admin/content/projects', 'icon' => '📂'];
        });
        $results = $results->merge($services)->merge($categories);

        // 7. Search Static CMS Routes
        $staticRoutes = collect([
            ['type' => 'Navigation', 'label' => 'Edit Home Page', 'to' => '/admin/content/home', 'icon' => '🏠', 'keywords' => ['home', 'hero', 'landing', 'front']],
            ['type' => 'Navigation', 'label' => 'Platform Settings', 'to' => '/admin/settings', 'icon' => '⚙️', 'keywords' => ['settings', 'platform', 'google', 'facebook', 'viber', 'social']],
            ['type' => 'Navigation', 'label' => 'Contact Page Info', 'to' => '/admin/content/contact', 'icon' => '📞', 'keywords' => ['contact', 'address', 'phone', 'email', 'office', 'hours']],
            ['type' => 'Navigation', 'label' => 'About Us Content', 'to' => '/admin/content/about', 'icon' => 'ℹ️', 'keywords' => ['about', 'history', 'team', 'philosophy']],
        ]);

        $navResults = $staticRoutes->filter(function($route) use ($query) {
            foreach ($route['keywords'] as $keyword) {
                if (stripos($keyword, $query) !== false || stripos($query, $keyword) !== false) {
                    return true;
                }
            }
            return false;
        })->map(function($route, $index) {
            return [
                'id' => 'nav_' . $index,
                'type' => $route['type'],
                'label' => $route['label'],
                'to' => $route['to'],
                'icon' => $route['icon']
            ];
        })->values();
        
        $results = $results->merge($navResults);

        return response()->json($results->take(15)->values());
    }
}