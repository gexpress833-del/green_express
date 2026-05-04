<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'currency')) {
                $table->string('currency', 3)->default('CDF')->after('total_amount');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'currency')) {
                $table->string('currency', 3)->default('CDF')->after('price');
            }
            if (!Schema::hasColumn('order_items', 'original_price')) {
                $table->decimal('original_price', 12, 2)->nullable()->after('currency');
            }
            if (!Schema::hasColumn('order_items', 'original_currency')) {
                $table->string('original_currency', 3)->nullable()->after('original_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['currency', 'original_price', 'original_currency']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
