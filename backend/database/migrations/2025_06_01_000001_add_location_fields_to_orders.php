<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_latitude', 10, 8)->nullable()->after('delivery_address');
            $table->decimal('delivery_longitude', 11, 8)->nullable()->after('delivery_latitude');
            $table->decimal('driver_latitude', 10, 8)->nullable()->after('delivery_longitude');
            $table->decimal('driver_longitude', 11, 8)->nullable()->after('driver_latitude');
            $table->timestamp('location_updated_at')->nullable()->after('driver_longitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_latitude',
                'delivery_longitude',
                'driver_latitude',
                'driver_longitude',
                'location_updated_at',
            ]);
        });
    }
};
