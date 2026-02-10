<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_schedule_exceptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_user_id');
            $table->date('date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('is_available')->default(false);
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign('admin_user_id')
                ->references('id')
                ->on('admin_users')
                ->onDelete('cascade');

            $table->index(['admin_user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_schedule_exceptions');
    }
};
