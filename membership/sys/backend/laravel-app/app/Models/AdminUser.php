<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminUser extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'username',
        'password',
        'name',
        'role',
        'is_active',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_enabled',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'two_factor_secret' => 'encrypted',
        'two_factor_recovery_codes' => 'encrypted',
    ];

    public function tokens(): HasMany
    {
        return $this->hasMany(AdminToken::class);
    }

    public function qrSessions(): HasMany
    {
        return $this->hasMany(QrSession::class);
    }
}
