<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'menu_id' => 'nullable|exists:menus,id',
            'image' => 'nullable|string|max:2000',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'points_required' => 'nullable|integer|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'quantity_limit' => 'nullable|integer|min:0',
            'start_at' => 'nullable|date_format:Y-m-d\TH:i',
            'end_at' => 'nullable|date_format:Y-m-d\TH:i|after_or_equal:start_at',
        ];
    }
}
