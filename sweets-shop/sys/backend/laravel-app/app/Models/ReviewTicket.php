<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReviewTicket extends Model
{
    use HasUuids;

    protected $fillable = [
        'member_id',
        'qr_token',
        'issued_by',
        'is_used',
        'used_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function issuedByAdmin(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'issued_by');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
