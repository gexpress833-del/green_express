<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'generated_by',
        'params',
        'file_path',
        'status',
    ];

    protected $casts = [
        'params' => 'array',
    ];

    protected $appends = ['report_type', 'report_format'];

    public function generatedByUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'generated_by');
    }

    /** Type de rapport stocké dans params (pour affichage). */
    public function getReportTypeAttribute(): string
    {
        return $this->params['type'] ?? '—';
    }

    /** Format stocké dans params. */
    public function getReportFormatAttribute(): string
    {
        return strtoupper($this->params['format'] ?? '—');
    }
}
