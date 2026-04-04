<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
        if (!Schema::hasColumn('inquiries', 'external_id')) {
            Schema::table('inquiries', function (Blueprint $table) {
                $table->string('external_id')->nullable()->unique();
            });
        }
}

    /**
     * Reverse the migrations.
     */
    public function down()
{
    Schema::table('inquiries', function (Blueprint $table) {
        $table->dropColumn('external_id');
    });
}
};
