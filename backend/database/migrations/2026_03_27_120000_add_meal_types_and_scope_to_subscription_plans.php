<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            /** individual = particuliers, company = entreprises B2B, both = les deux catalogues */
            $table->string('plan_scope', 20)->default('both')->after('description');
            /** Types de repas inclus (JSON) : [{ "label", "detail", "emoji" }] */
            $table->json('meal_types')->nullable()->after('plan_scope');
            /** Points forts marketing optionnels */
            $table->json('highlights')->nullable()->after('meal_types');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['plan_scope', 'meal_types', 'highlights']);
        });
    }
};
