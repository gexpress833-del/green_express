<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('menus', function (Blueprint $table) {
            // Ajouter les colonnes manquantes pour MenuCard
            $table->string('name')->nullable()->after('title'); // Alias pour title
            $table->boolean('is_available')->default(true)->after('status');
            $table->boolean('is_popular')->default(false)->after('is_available');
        });
    }

    public function down()
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn(['name', 'is_available', 'is_popular']);
        });
    }
};
