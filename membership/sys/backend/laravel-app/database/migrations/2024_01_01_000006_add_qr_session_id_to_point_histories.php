<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('point_histories', function (Blueprint $table) {
            $table->uuid('qr_session_id')->nullable()->after('reason');

            $table->foreign('qr_session_id')
                ->references('id')
                ->on('qr_sessions')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('point_histories', function (Blueprint $table) {
            $table->dropForeign(['qr_session_id']);
            $table->dropColumn('qr_session_id');
        });
    }
};
