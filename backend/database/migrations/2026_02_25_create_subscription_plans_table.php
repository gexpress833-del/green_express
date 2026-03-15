<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price_week', 12, 2)->default(0);
            $table->decimal('price_month', 12, 2)->default(0);
            $table->string('currency', 5)->default('CDF');
            $table->unsignedTinyInteger('days_per_week')->default(5);
            $table->unsignedTinyInteger('days_per_month')->default(20);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subscription_plans');
    }
};
