<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_id')->nullable()->constrained('menus')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image', 2048)->nullable();
            $table->string('meal_slot', 80)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plan_items');
    }
};
