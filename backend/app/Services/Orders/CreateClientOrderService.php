<?php

namespace App\Services\Orders;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\OrderNotificationService;
use App\Services\PhoneRDCService;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Création d’une commande client (statut pending_payment).
 * Logique extraite de OrderController::store pour réutilisation API + Livewire.
 */
class CreateClientOrderService
{
    public function __construct(
        private OrderNotificationService $orderNotifications,
    ) {}

    /**
     * @param  array{
     *     items: array<int, array{menu_id: int, quantity: int, price?: float|null, currency?: string|null, original_price?: float|null, original_currency?: string|null}>,
     *     delivery_address: string,
     *     client_phone_number: string,
     *     currency?: string|null,
     *     company_id?: int|null,
     * }  $data  Données déjà validées (équivalent StoreOrderRequest::validated()).
     */
    public function create(User $user, array $data): Order
    {
        $orderCurrency = strtoupper((string) ($data['currency'] ?? 'CDF'));
        $total = 0.0;
        $totalQuantity = 0;

        foreach ($data['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $price = $itemData['price'] ?? $menu->price;
            $itemCurrency = strtoupper((string) ($itemData['currency'] ?? $orderCurrency));
            $quantity = (int) $itemData['quantity'];

            if ($itemCurrency !== $orderCurrency) {
                throw ValidationException::withMessages([
                    'items' => ['Tous les plats doivent être commandés dans la même devise.'],
                ]);
            }

            $total += $price * $quantity;
            $totalQuantity += $quantity;
        }

        $pointsEarned = $totalQuantity * 12;

        $phoneNorm = PhoneRDCService::formatPhoneRDC($data['client_phone_number']);
        if (! PhoneRDCService::isValidPhoneRDC($phoneNorm)) {
            throw ValidationException::withMessages([
                'client_phone_number' => ['Numéro Mobile Money invalide (RDC : 9 chiffres après l’indicatif 243).'],
            ]);
        }

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'company_id' => $data['company_id'] ?? null,
            'status' => 'pending_payment',
            'delivery_address' => $data['delivery_address'],
            'client_phone_number' => $phoneNorm,
            'total_amount' => $total,
            'currency' => $orderCurrency,
            'points_earned' => $pointsEarned,
            'delivery_code' => null,
        ]);

        foreach ($data['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $price = $itemData['price'] ?? $menu->price;
            $itemCurrency = strtoupper((string) ($itemData['currency'] ?? $orderCurrency));

            OrderItem::create([
                'order_id' => $order->id,
                'menu_id' => $itemData['menu_id'],
                'quantity' => $itemData['quantity'],
                'price' => $price,
                'currency' => $itemCurrency,
                'original_price' => $itemData['original_price'] ?? $menu->price,
                'original_currency' => strtoupper((string) ($itemData['original_currency'] ?? ($menu->currency ?? $itemCurrency))),
            ]);
        }

        $this->orderNotifications->notifyOrderCreated($order->load('user'));

        return $order->load('items.menu');
    }
}
