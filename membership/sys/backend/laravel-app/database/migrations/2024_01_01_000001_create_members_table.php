<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('line_user_id')->unique();
            $table->string('display_name');
            $table->string('member_number')->unique();
            $table->integer('points')->default(0);
            $table->enum('rank', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->string('picture_url')->nullable();
            $table->timestamps();

            $table->index('line_user_id');
            $table->index('member_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
