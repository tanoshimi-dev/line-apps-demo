<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_user_id');
            $table->enum('type', ['spend', 'earn']);
            $table->integer('points')->nullable();
            $table->string('token', 64)->unique();
            $table->enum('status', ['pending', 'completed', 'expired'])->default('pending');
            $table->uuid('member_id')->nullable();
            $table->string('reason')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('admin_user_id')
                ->references('id')
                ->on('admin_users')
                ->onDelete('cascade');

            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->onDelete('set null');

            $table->index('token');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_sessions');
    }
};
