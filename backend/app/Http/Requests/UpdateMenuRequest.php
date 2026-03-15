<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'status' => 'sometimes|string|in:draft,pending,approved,rejected',
            'available_from' => 'nullable|date',
            'available_to' => 'nullable|date',
            'image' => 'nullable|string|url',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ];
    }
}
