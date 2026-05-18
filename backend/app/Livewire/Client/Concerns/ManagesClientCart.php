<?php

namespace App\Livewire\Client\Concerns;

use App\Models\Menu;
use App\Services\Orders\CreateClientOrderService;
use App\Support\MenuPriceConverter;

/**
 * Panier + devise partagés entre pages Livewire client (session).
 */
trait ManagesClientCart
{
    public string $preferredCurrency = 'CDF';

    public float $usdCdfRate = MenuPriceConverter::DEFAULT_USD_CDF_RATE;

    /** @var array<int, array<string, mixed>> */
    public array $cart = [];

    public string $delivery_address = '';

    public string $client_phone_number = '';

    protected function initializeClientCartState(): void
    {
        $this->usdCdfRate = MenuPriceConverter::defaultUsdCdfRate();
        $saved = session('client_preferred_currency');
        if (in_array($saved, ['USD', 'CDF'], true)) {
            $this->preferredCurrency = $saved;
        }
        $this->loadCartFromSession();
    }

    protected function loadCartFromSession(): void
    {
        $raw = session('client_cart', []);
        $this->cart = is_array($raw) ? $this->normalizeCartSessionKeys($raw) : [];
    }

    /**
     * @param  array<int|string, mixed>  $cart
     * @return array<int, array<string, mixed>>
     */
    protected function normalizeCartSessionKeys(array $cart): array
    {
        $out = [];
        foreach ($cart as $k => $row) {
            if (is_array($row)) {
                $out[(int) $k] = $row;
            }
        }

        return $out;
    }

    protected function persistCartToSession(): void
    {
        session(['client_cart' => $this->cart]);
    }

    public function setPreferredCurrency(string $currency): void
    {
        $next = MenuPriceConverter::normalizeCurrency($currency);
        if ($next === $this->preferredCurrency) {
            return;
        }

        $this->preferredCurrency = $next;
        $this->cart = [];
        $this->resetErrorBag('cart');
        session(['client_preferred_currency' => $next]);
        $this->persistCartToSession();
    }

    public function addToCart(int $menuId): void
    {
        $menu = Menu::query()->where('status', 'approved')->whereKey($menuId)->firstOrFail();

        $priced = MenuPriceConverter::convertMenu($menu, $this->preferredCurrency, $this->usdCdfRate);

        if (isset($this->cart[$menuId])) {
            $this->cart[$menuId]['quantity']++;
        } else {
            $this->cart[$menuId] = [
                'menu_id' => $menu->id,
                'title' => $menu->title ?? $menu->name ?? 'Plat',
                'price' => $priced['price'],
                'currency' => $priced['currency'],
                'original_price' => $priced['original_price'],
                'original_currency' => $priced['original_currency'],
                'image' => $menu->image,
                'quantity' => 1,
            ];
        }
        $this->resetErrorBag('cart');
        $this->persistCartToSession();
    }

    public function increment(int $menuId): void
    {
        if (! isset($this->cart[$menuId])) {
            return;
        }
        $this->cart[$menuId]['quantity']++;
        $this->persistCartToSession();
    }

    public function decrement(int $menuId): void
    {
        if (! isset($this->cart[$menuId])) {
            return;
        }
        $this->cart[$menuId]['quantity']--;
        if ($this->cart[$menuId]['quantity'] < 1) {
            unset($this->cart[$menuId]);
        }
        $this->persistCartToSession();
    }

    public function removeLine(int $menuId): void
    {
        unset($this->cart[$menuId]);
        $this->persistCartToSession();
    }

    public function cartTotal(): float
    {
        $t = 0.0;
        foreach ($this->cart as $line) {
            $t += (float) $line['price'] * (int) $line['quantity'];
        }

        return $t;
    }

    public function cartCurrency(): ?string
    {
        foreach ($this->cart as $line) {
            return is_string($line['currency'] ?? null) ? $line['currency'] : null;
        }

        return null;
    }

    public function submitOrder(CreateClientOrderService $orders): void
    {
        $this->validate([
            'delivery_address' => 'required|string|max:500',
            'client_phone_number' => 'required|string|max:30',
        ], [
            'delivery_address.required' => 'L’adresse de livraison est obligatoire.',
            'client_phone_number.required' => 'Le numéro Mobile Money est obligatoire.',
        ]);

        if ($this->cart === []) {
            $this->addError('cart', 'Ajoutez au moins un plat au panier.');

            return;
        }

        $items = [];
        foreach ($this->cart as $line) {
            $items[] = [
                'menu_id' => $line['menu_id'],
                'quantity' => $line['quantity'],
                'price' => $line['price'],
                'currency' => $line['currency'],
                'original_price' => $line['original_price'],
                'original_currency' => $line['original_currency'],
            ];
        }

        $currency = $items[0]['currency'];
        $data = [
            'items' => $items,
            'delivery_address' => $this->delivery_address,
            'client_phone_number' => $this->client_phone_number,
            'currency' => $currency,
        ];

        $order = $orders->create(auth()->user(), $data);

        $this->cart = [];
        $this->delivery_address = '';
        $this->client_phone_number = '';
        $this->persistCartToSession();

        session()->flash('status', 'Commande #'.$order->id.' enregistrée — statut : paiement en attente.');

        $this->redirect(route('client.orders.show', $order), navigate: false);
    }
}
