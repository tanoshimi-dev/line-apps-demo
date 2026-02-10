<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_user_id');
            $table->enum('type', ['earn_points', 'spend_points', 'review_ticket']);
            $table->string('token')->unique();
            $table->integer('points_amount')->nullable();
            $table->boolean('is_used')->default(false);
            $table->uuid('used_by_member_id')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('admin_user_id')->references('id')->on('admin_users')->onDelete('cascade');
            $table->foreign('used_by_member_id')->references('id')->on('members')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_codes');
    }
};
