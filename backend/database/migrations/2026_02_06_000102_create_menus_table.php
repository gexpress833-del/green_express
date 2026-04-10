<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('status')->default('draft');
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_to')->nullable();
            $table->timestamps();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('menus');
    }
};
