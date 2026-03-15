<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('menu_id')->nullable()->constrained('menus')->onDelete('set null');
            $table->integer('points_required')->nullable();
            $table->decimal('discount', 8, 2)->nullable();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->integer('quantity_limit')->nullable();
            $table->timestamps();
        });

        Schema::create('points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->bigInteger('balance')->default(0);
            $table->timestamps();
        });

        Schema::create('point_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('delta');
            $table->string('reason')->nullable();
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->json('params')->nullable();
            $table->string('file_path')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('point_ledgers');
        Schema::dropIfExists('points');
        Schema::dropIfExists('promotions');
    }
};
