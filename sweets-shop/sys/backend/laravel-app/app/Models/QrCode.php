<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QrCode extends Model
{
    use HasUuids;

    protected $fillable = [
        'admin_user_id',
        'type',
        'token',
        'points_amount',
        'is_used',
        'used_by_member_id',
        'expires_at',
    ];

    protected $casts = [
        'points_amount' => 'integer',
        'is_used' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class);
    }

    public function usedByMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'used_by_member_id');
    }
}
