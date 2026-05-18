@php
    use App\Services\CloudinaryService;
    use App\Support\MenuPriceConverter;
    $hasCart = count($cart) > 0;
@endphp

<div class="relative mx-auto max-w-7xl px-4 pt-6 {{ $hasCart ? 'pb-28 lg:pb-12' : 'pb-12' }}">
    @if (session('status'))
        <div class="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm ring-1 ring-emerald-700/10">
            {{ session('status') }}
        </div>
    @endif

    {{-- Aligné sur frontend-next/app/client/menus/page.jsx --}}
    <header class="relative mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-8 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/10">
        <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div class="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl"></div>
        <div class="relative">
            <p class="text-2xl" aria-hidden="true">🍜</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Menus disponibles</h1>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/95">
                Découvrez nos plats préparés avec soin — ajoutez au panier ou commandez en un clic.
            </p>
            <p class="mt-4 text-xs font-medium uppercase tracking-wide text-emerald-100/85">
                Catalogue du moment · {{ $catalogueLabel }}
            </p>
            @if ($hasCart && Route::has('client.cart'))
                <p class="mt-5">
                    <a
                        href="{{ route('client.cart') }}"
                        class="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
                    >
                        Voir mon panier détaillé
                        <span aria-hidden="true">→</span>
                    </a>
                </p>
            @endif
        </div>
    </header>

    @include('livewire.client.partials.currency-panel')

    {{--
      Mobile : panier en premier (order) pour voir le récap et le bouton sans scroller tout le catalogue.
      Desktop : catalogue à gauche, panier sticky à droite.
    --}}
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        {{-- Catalogue --}}
        <section class="order-2 min-w-0 w-full lg:order-1" aria-labelledby="carte-heading">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 id="carte-heading" class="sr-only">Plats disponibles</h2>
                <div class="w-full max-w-md">
                    <p class="mb-1 text-base font-semibold text-zinc-900">Trouver un plat</p>
                    <p class="mb-3 text-sm text-zinc-500">Saisissez un mot-clé (nom du plat, ingrédient…) — la liste se met à jour automatiquement.</p>
                    <label for="menu-search" class="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        <svg class="h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                        Recherche
                    </label>
                    <input
                        id="menu-search"
                        wire:model.live.debounce.300ms="search"
                        type="search"
                        placeholder="Ex. poulet, frites, dessert…"
                        autocomplete="off"
                        class="w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm ring-1 ring-zinc-950/5 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                    />
                </div>
            </div>

            @if ($menus->total() === 0)
                <div class="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
                    @if (strlen(trim($search)) > 0)
                        <p class="text-base font-semibold text-zinc-800">Aucun plat ne correspond à cette recherche.</p>
                        <p class="mt-2 text-sm text-zinc-500">Modifiez les mots-clés ou effacez le champ pour tout afficher.</p>
                    @else
                        <p class="text-base font-semibold text-zinc-800">Aucun plat disponible pour le moment.</p>
                        <p class="mt-2 max-w-md mx-auto text-sm text-zinc-500">
                            Seuls les menus <strong class="font-medium text-zinc-700">approuvés</strong> en base sont listés ici. Les nouveaux plats peuvent encore être en attente de validation.
                        </p>
                    @endif
                </div>
            @else
                <div class="mt-8 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    @foreach ($menus as $menu)
                        @php
                            $available = ($menu->is_available ?? true) && $menu->status === 'approved';
                            $cardImg = $menu->image ? CloudinaryService::menuCardImageUrl($menu->image) : '';
                            $priced = MenuPriceConverter::convertMenu($menu, $preferredCurrency, $usdCdfRate);
                        @endphp
                        <article wire:key="menu-{{ $menu->id }}" class="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100/90 bg-white shadow-md shadow-zinc-900/5 ring-1 ring-zinc-950/[0.06] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/10">
                            <div class="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-emerald-50/30">
                                @if ($cardImg !== '')
                                    <img
                                        src="{{ $cardImg }}"
                                        alt="{{ $menu->title ?? $menu->name }}"
                                        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                        loading="lazy"
                                        decoding="async"
                                        onerror="this.classList.add('hidden'); this.nextElementSibling?.classList.remove('hidden')"
                                    />
                                    <div class="hidden flex h-full flex-col items-center justify-center gap-1 bg-zinc-100 text-zinc-400">
                                        <svg class="h-10 w-10 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                        <span class="text-xs">Image indisponible</span>
                                    </div>
                                @else
                                    <div class="flex h-full flex-col items-center justify-center gap-1 text-zinc-400">
                                        <svg class="h-10 w-10 opacity-40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                        <span class="text-xs">Pas d’image</span>
                                    </div>
                                @endif
                            </div>
                            <div class="flex flex-1 flex-col p-5">
                                <h3 class="font-semibold leading-snug text-zinc-900">{{ $menu->title ?? $menu->name }}</h3>
                                @if ($menu->description)
                                    <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">{{ $menu->description }}</p>
                                @endif
                                <p class="mt-4 text-lg font-bold tabular-nums text-emerald-700">
                                    {{ \App\Support\MoneyFormatter::format($priced['price'], $priced['currency']) }}
                                </p>
                                <div class="mt-5 flex flex-1 flex-col justify-end">
                                    <button
                                        type="button"
                                        wire:click="addToCart({{ $menu->id }})"
                                        @disabled(!$available)
                                        class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none"
                                    >
                                        <svg class="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        {{ $available ? 'Ajouter au panier' : 'Indisponible' }}
                                    </button>
                                </div>
                            </div>
                        </article>
                    @endforeach
                </div>

                <div class="mt-8 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-center text-sm text-zinc-600">
                    <strong class="text-zinc-800">{{ $menus->total() }}</strong> plat{{ $menus->total() > 1 ? 's' : '' }} au menu — Bon appétit !
                </div>

                <div class="mt-6 flex justify-center border-t border-zinc-100 pt-6">
                    {{ $menus->onEachSide(1)->links() }}
                </div>
            @endif
        </section>

        {{-- Panier (partiel partagé avec la page Mon panier) --}}
        <aside class="order-1 min-w-0 w-full lg:order-2 lg:sticky lg:top-20 lg:self-start" aria-label="Panier et validation">
            @include('livewire.client.partials.cart-checkout-card', [
                'cartTitle' => 'Panier',
                'emptyCartTitle' => 'Votre panier est vide',
                'emptyCartHint' => 'Ajoutez des plats depuis la liste ci-dessous pour commander.',
                'emptyCartLinkHref' => '',
                'emptyCartLinkLabel' => '',
            ])
        </aside>
    </div>
</div>
