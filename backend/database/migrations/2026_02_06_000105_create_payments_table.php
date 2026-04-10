<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->string('provider')->nullable();
            $table->string('provider_payment_id')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency')->default('USD');
            $table->string('status')->default('pending');
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
};
