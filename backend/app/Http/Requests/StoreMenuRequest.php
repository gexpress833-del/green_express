<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'image' => 'nullable|string|url',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'status' => 'nullable|string|in:draft,pending,approved,rejected',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre du menu est obligatoire.',
            'price.required' => 'Le prix est obligatoire.',
            'image_file.mimes' => 'L\'image doit être au format JPEG, PNG, JPG ou WebP.',
            'image_file.max' => 'L\'image ne doit pas dépasser 5 Mo.',
        ];
    }
}
