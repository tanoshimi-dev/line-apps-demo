<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminToken extends Model
{
    use HasUuids;

    protected $fillable = [
        'admin_user_id',
        'token',
        'expires_at',
        'two_factor_confirmed',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'two_factor_confirmed' => 'boolean',
        ];
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
