<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_add_projects_cta_settings.php
public function up(): void
{
    DB::table('settings')->insertOrIgnore([
        ['key' => 'projects_cta_image', 'value' => null],
        ['key' => 'projects_cta_text',  'value' => 'Non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita.'],
    ]);
}

public function down(): void
{
    DB::table('settings')->whereIn('key', ['projects_cta_image', 'projects_cta_text'])->delete();
}
};
