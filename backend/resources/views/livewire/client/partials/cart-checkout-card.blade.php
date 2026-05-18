@php
    use App\Services\CloudinaryService;
    $hasCart = count($cart) > 0;
@endphp

<div class="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-950/[0.05]">
    <div class="flex items-center justify-between gap-3 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 text-white">
        <div class="flex items-center gap-2.5">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            </span>
            <div>
                <h2 class="text-lg font-bold leading-tight">{{ $cartTitle ?? 'Panier' }}</h2>
                @if ($hasCart)
                    <p class="text-xs text-emerald-100/90">{{ count($cart) }} ligne{{ count($cart) > 1 ? 's' : '' }}</p>
                @endif
            </div>
        </div>
        @if ($hasCart)
            <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tabular-nums ring-1 ring-white/30">
                {{ \App\Support\MoneyFormatter::format($this->cartTotal(), $this->cartCurrency() ?? 'CDF') }}
            </span>
        @endif
    </div>

    <div class="p-5">
        @error('cart')
            <div class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">{{ $message }}</div>
        @enderror

        @if (! $hasCart)
            <div class="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-12 text-center">
                <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-200/80 text-zinc-500">
                    <svg class="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                </div>
                <p class="text-sm font-medium text-zinc-700">{{ $emptyCartTitle ?? 'Votre panier est vide' }}</p>
                <p class="mt-1 text-sm text-zinc-500">{{ $emptyCartHint ?? 'Ajoutez des plats depuis la carte pour commander.' }}</p>
                @if (! empty($emptyCartLinkHref))
                    <a href="{{ $emptyCartLinkHref }}" class="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                        {{ $emptyCartLinkLabel ?? 'Voir les menus' }}
                    </a>
                @endif
            </div>
        @else
            <ul class="max-h-[min(45vh,280px)] space-y-0 divide-y divide-zinc-100 overflow-y-auto pr-1 lg:max-h-[min(50vh,320px)]">
                @foreach ($cart as $menuId => $line)
                    @php $thumb = ! empty($line['image']) ? CloudinaryService::menuThumbImageUrl($line['image']) : ''; @endphp
                    <li class="flex gap-3 py-3 first:pt-0">
                        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/80">
                            @if ($thumb !== '')
                                <img src="{{ $thumb }}" alt="" class="h-full w-full object-cover" loading="lazy" decoding="async" />
                            @else
                                <div class="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">—</div>
                            @endif
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="truncate font-medium text-zinc-900">{{ $line['title'] }}</p>
                            <p class="text-xs text-zinc-500">
                                {{ \App\Support\MoneyFormatter::format((float) $line['price'], (string) $line['currency']) }} × {{ $line['quantity'] }}
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-0.5 self-center">
                            <button
                                type="button"
                                wire:click="decrement({{ (int) $menuId }})"
                                class="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg leading-none text-zinc-700 shadow-sm hover:bg-zinc-50"
                                aria-label="Diminuer"
                            >−</button>
                            <span class="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-zinc-900">{{ $line['quantity'] }}</span>
                            <button
                                type="button"
                                wire:click="increment({{ (int) $menuId }})"
                                class="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg leading-none text-zinc-700 shadow-sm hover:bg-zinc-50"
                                aria-label="Augmenter"
                            >+</button>
                        </div>
                    </li>
                @endforeach
            </ul>

            <div class="mt-5 flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/80">
                <span class="text-sm font-semibold text-zinc-600">Total</span>
                <span class="text-xl font-bold tabular-nums text-zinc-900">
                    {{ \App\Support\MoneyFormatter::format($this->cartTotal(), $this->cartCurrency() ?? 'CDF') }}
                </span>
            </div>

            <form id="commande-client" wire:submit="submitOrder" class="mt-6 space-y-5 border-t border-zinc-100 pt-6">
                <div>
                    <label for="delivery_address" class="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                        <svg class="h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                        Adresse de livraison
                    </label>
                    <textarea
                        id="delivery_address"
                        wire:model.blur="delivery_address"
                        rows="3"
                        class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm ring-1 ring-zinc-950/5 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 @error('delivery_address') border-red-400 ring-red-200 @enderror"
                        placeholder="Quartier, avenue, point de repère…"
                    ></textarea>
                    @error('delivery_address')
                        <p class="mt-1.5 text-xs font-medium text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label for="client_phone_number" class="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                        <svg class="h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V9m-7.5-7.5h6m0 0 3 3m-3-3v3" /></svg>
                        Mobile Money
                    </label>
                    <input
                        id="client_phone_number"
                        wire:model.blur="client_phone_number"
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm ring-1 ring-zinc-950/5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 @error('client_phone_number') border-red-400 ring-red-200 @enderror"
                        placeholder="Ex. 08… ou +243…"
                    />
                    @error('client_phone_number')
                        <p class="mt-1.5 text-xs font-medium text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                <button
                    type="submit"
                    class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    wire:loading.attr="disabled"
                >
                    <svg class="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    <span wire:loading.remove wire:target="submitOrder">Valider et passer la commande</span>
                    <span wire:loading wire:target="submitOrder">Envoi en cours…</span>
                </button>
                <p class="text-center text-xs text-zinc-500">Vous serez redirigé vers le détail de la commande après validation.</p>
            </form>
        @endif
    </div>
</div>

@if ($hasCart)
    <div
        class="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/90 bg-white/95 p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md lg:hidden"
        style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
        role="region"
        aria-label="Accès rapide commande"
    >
        <div class="mx-auto flex max-w-lg items-center gap-4">
            <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-zinc-500">Total à payer</p>
                <p class="text-xl font-bold tabular-nums text-zinc-900">
                    {{ \App\Support\MoneyFormatter::format($this->cartTotal(), $this->cartCurrency() ?? 'CDF') }}
                </p>
            </div>
            <button
                type="button"
                class="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20"
                onclick="document.getElementById('commande-client')?.scrollIntoView({ behavior: 'smooth', block: 'start' })"
            >
                Commander
            </button>
        </div>
    </div>
@endif
