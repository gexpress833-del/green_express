<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Les promotions sont des repas spéciaux, distincts des plats du menu.
     * Chaque promotion a sa propre image, titre et description (optionnels).
     */
    public function up()
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->string('image', 2000)->nullable()->after('menu_id');
            $table->string('title', 255)->nullable()->after('image');
            $table->text('description')->nullable()->after('title');
        });
    }

    public function down()
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn(['image', 'title', 'description']);
        });
    }
};
