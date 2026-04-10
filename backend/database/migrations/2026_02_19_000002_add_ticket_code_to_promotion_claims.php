<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('promotion_claims', function (Blueprint $table) {
            $table->string('ticket_code', 32)->nullable()->unique()->after('status');
            $table->timestamp('validated_at')->nullable()->after('ticket_code');
        });
    }

    public function down()
    {
        Schema::table('promotion_claims', function (Blueprint $table) {
            $table->dropColumn(['ticket_code', 'validated_at']);
        });
    }
};
