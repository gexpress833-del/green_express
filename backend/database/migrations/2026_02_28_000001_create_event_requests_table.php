<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_requests', function (Blueprint $table) {
            $table->id();
            $table->string('event_type'); // Conférences, Mariages, etc.
            $table->date('event_date');
            $table->unsignedInteger('guest_count');
            $table->string('budget', 100)->nullable();
            $table->text('message')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('pending'); // pending, contacted, closed
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_requests');
    }
};
