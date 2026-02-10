<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_user_id');
            $table->tinyInteger('day_of_week'); // 0=Sun, 1=Mon, ..., 6=Sat
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->foreign('admin_user_id')
                ->references('id')
                ->on('admin_users')
                ->onDelete('cascade');

            $table->unique(['admin_user_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_schedules');
    }
};
