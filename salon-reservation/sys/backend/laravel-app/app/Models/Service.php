<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'duration_minutes',
        'price',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'duration_minutes' => 'integer',
            'price' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(AdminUser::class, 'staff_services');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
