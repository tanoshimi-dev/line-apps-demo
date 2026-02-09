<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $table->text('two_factor_secret')->nullable()->after('password');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->boolean('two_factor_enabled')->default(false)->after('two_factor_recovery_codes');
        });

        Schema::table('admin_tokens', function (Blueprint $table) {
            $table->boolean('two_factor_confirmed')->default(true)->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_secret', 'two_factor_recovery_codes', 'two_factor_enabled']);
        });

        Schema::table('admin_tokens', function (Blueprint $table) {
            $table->dropColumn('two_factor_confirmed');
        });
    }
};
