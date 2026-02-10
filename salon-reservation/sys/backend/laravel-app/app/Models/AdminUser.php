<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminUser extends Model
{
    use HasUuids;

    protected $fillable = [
        'username',
        'password',
        'name',
        'role',
        'is_active',
        'specialty',
        'bio',
        'avatar_url',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_enabled',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted',
        ];
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(AdminToken::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(StaffSchedule::class);
    }

    public function scheduleExceptions(): HasMany
    {
        return $this->hasMany(StaffScheduleException::class);
    }

    public function staffServices(): HasMany
    {
        return $this->hasMany(StaffService::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'staff_services');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
