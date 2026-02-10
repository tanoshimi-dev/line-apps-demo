<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use HasUuids;

    protected $fillable = [
        'line_user_id',
        'display_name',
        'picture_url',
        'points_balance',
    ];

    protected $casts = [
        'points_balance' => 'integer',
    ];

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function reviewTickets(): HasMany
    {
        return $this->hasMany(ReviewTicket::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
