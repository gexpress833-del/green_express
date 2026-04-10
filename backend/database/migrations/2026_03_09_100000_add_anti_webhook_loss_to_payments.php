<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('reference_id')->nullable()->after('provider_payment_id');
            $table->string('phone', 30)->nullable()->after('currency');
            $table->timestamp('last_checked_at')->nullable()->after('status');
            $table->unsignedTinyInteger('retry_count')->default(0)->after('last_checked_at');
            $table->string('failure_reason')->nullable()->after('retry_count');
        });
    }

    public function down()
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['reference_id', 'phone', 'last_checked_at', 'retry_count', 'failure_reason']);
        });
    }
};
