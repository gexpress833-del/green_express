<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('period', 10)->default('month')->after('price'); // 'week' | 'month'
            $table->string('currency', 5)->default('CDF')->after('period');
        });
    }

    public function down()
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['period', 'currency']);
        });
    }
};
