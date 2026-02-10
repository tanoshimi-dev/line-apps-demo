<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('member_id');
            $table->uuid('admin_user_id')->nullable();
            $table->enum('direction', ['salon_to_member', 'member_to_salon']);
            $table->text('content');
            $table->boolean('sent_via_line')->default(false);
            $table->timestamp('created_at')->nullable();

            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->onDelete('cascade');

            $table->foreign('admin_user_id')
                ->references('id')
                ->on('admin_users')
                ->onDelete('set null');

            $table->index(['member_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
