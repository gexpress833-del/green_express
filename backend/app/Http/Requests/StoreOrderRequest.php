<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|integer|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1|max:100',
            'items.*.price' => 'nullable|numeric|min:0',
            'delivery_address' => 'required|string|max:500',
            'company_id' => 'nullable|integer|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'La commande doit contenir au moins un plat.',
            'items.*.menu_id.exists' => 'Un des plats sélectionnés est invalide.',
            'delivery_address.required' => 'L\'adresse de livraison est obligatoire.',
        ];
    }
}
