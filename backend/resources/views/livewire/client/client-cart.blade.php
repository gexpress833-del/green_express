@php
    $hasCart = count($cart) > 0;
@endphp

<div class="relative mx-auto max-w-2xl px-4 pt-6 {{ $hasCart ? 'pb-28 lg:pb-12' : 'pb-12' }}">
    @if (session('status'))
        <div class="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm ring-1 ring-emerald-700/10">
            {{ session('status') }}
        </div>
    @endif

    <header class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Mon panier</h1>
        <p class="mt-2 text-sm text-zinc-600">
            Vérifiez vos articles, puis renseignez l’adresse et le Mobile Money pour valider — le même panier que sur la page Menus.
        </p>
        <a href="{{ route('client.menus') }}" class="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            ← Retour aux menus
        </a>
    </header>

    @include('livewire.client.partials.currency-panel')

    @include('livewire.client.partials.cart-checkout-card', [
        'cartTitle' => 'Récapitulatif',
        'emptyCartTitle' => 'Panier vide',
        'emptyCartHint' => 'Parcourez les menus pour ajouter des plats.',
        'emptyCartLinkHref' => route('client.menus'),
        'emptyCartLinkLabel' => 'Voir les menus',
    ])
</div>
