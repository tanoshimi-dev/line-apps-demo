<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'member_id',
        'admin_user_id',
        'direction',
        'content',
        'sent_via_line',
    ];

    protected function casts(): array
    {
        return [
            'sent_via_line' => 'boolean',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class);
    }
}
