<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_requests', function (Blueprint $table) {
            $table->string('contact_name', 150)->nullable()->after('message');
            $table->string('contact_email', 150)->nullable()->after('contact_name');
            $table->string('contact_phone', 50)->nullable()->after('contact_email');
        });
    }

    public function down(): void
    {
        Schema::table('event_requests', function (Blueprint $table) {
            $table->dropColumn(['contact_name', 'contact_email', 'contact_phone']);
        });
    }
};
