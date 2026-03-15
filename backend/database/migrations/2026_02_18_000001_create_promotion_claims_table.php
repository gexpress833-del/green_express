<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('promotion_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('promotion_id')->constrained('promotions')->onDelete('cascade');
            $table->integer('points_deducted')->nullable();
            $table->string('status')->default('claimed'); // claimed, used, expired
            $table->timestamps();

            $table->index('user_id');
            $table->index('promotion_id');
            $table->unique(['user_id', 'promotion_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('promotion_claims');
    }
};
