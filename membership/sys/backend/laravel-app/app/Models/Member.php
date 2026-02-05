<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'line_user_id',
        'display_name',
        'member_number',
        'points',
        'rank',
        'picture_url',
    ];

    protected $casts = [
        'points' => 'integer',
    ];

    protected $attributes = [
        'points' => 0,
        'rank' => 'bronze',
    ];

    public function pointHistories(): HasMany
    {
        return $this->hasMany(PointHistory::class);
    }

    public function updateRank(): void
    {
        $this->rank = match (true) {
            $this->points >= 10000 => 'platinum',
            $this->points >= 5000 => 'gold',
            $this->points >= 1000 => 'silver',
            default => 'bronze',
        };
        $this->save();
    }

    public static function generateMemberNumber(): string
    {
        do {
            $number = 'M' . str_pad(random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        } while (self::where('member_number', $number)->exists());

        return $number;
    }
}
