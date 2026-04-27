<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL; // <-- Add this

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Force HTTPS when using ngrok or in production
        if (env('APP_ENV') !== 'local' || request()->header('x-forwarded-proto') === 'https') {
            URL::forceScheme('https');
        }
        
        // Alternatively, they can temporarily just put this single line to test:
        // URL::forceScheme('https');
    }
}