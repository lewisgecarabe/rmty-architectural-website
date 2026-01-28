<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    // 2. It returns your main Blade view where React lives
    // NOTE: Change 'welcome' to 'app' if your file is resources/views/app.blade.php
    return view('app'); 
})->where('any', '.*');
