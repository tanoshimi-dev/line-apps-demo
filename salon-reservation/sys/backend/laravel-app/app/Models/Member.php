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
        'phone',
        'email',
    ];

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
