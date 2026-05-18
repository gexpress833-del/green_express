<div class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center gap-4">
        <a href="{{ route('client.orders.index') }}" class="text-sm text-emerald-700 hover:underline">← Mes commandes</a>
        <a href="{{ route('client.menus') }}" class="text-sm text-zinc-600 hover:text-zinc-900">Menus</a>
    </div>

    @if (session('status'))
        <div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {{ session('status') }}
        </div>
    @endif

    <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-sm text-zinc-500">Commande</p>
                <h1 class="text-2xl font-semibold text-zinc-900">#{{ $order->id }}</h1>
            </div>
            <div class="text-right">
                <span class="inline-block rounded-full px-3 py-1 text-sm font-medium {{ \App\Support\OrderStatusPresenter::badgeClasses($order->status) }}">
                    {{ \App\Support\OrderStatusPresenter::label($order->status) }}
                </span>
                <p class="mt-2 text-sm text-zinc-600">{{ $order->created_at?->translatedFormat('d/m/Y à H:i') }}</p>
            </div>
        </div>

        <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
                <dt class="text-zinc-500">Livraison</dt>
                <dd class="font-medium text-zinc-900">{{ $order->delivery_address }}</dd>
            </div>
            <div>
                <dt class="text-zinc-500">Mobile Money</dt>
                <dd class="font-medium text-zinc-900">{{ $order->client_phone_number }}</dd>
            </div>
        </dl>

        <h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">Lignes</h2>
        <ul class="mt-3 divide-y divide-zinc-100">
            @foreach ($order->items as $item)
                <li class="flex justify-between gap-4 py-3 text-sm">
                    <span class="text-zinc-900">
                        {{ $item->menu?->title ?? $item->menu?->name ?? 'Plat #'.$item->menu_id }}
                        <span class="text-zinc-500">× {{ $item->quantity }}</span>
                    </span>
                    <span class="shrink-0 font-medium">
                        {{ \App\Support\MoneyFormatter::format((float) $item->price * (int) $item->quantity, (string) ($item->currency ?? $order->currency ?? 'CDF')) }}
                    </span>
                </li>
            @endforeach
        </ul>

        <p class="mt-4 flex justify-between border-t border-zinc-100 pt-4 text-base font-semibold text-zinc-900">
            Total
            <span>{{ \App\Support\MoneyFormatter::format((float) $order->total_amount, (string) ($order->currency ?? 'CDF')) }}</span>
        </p>

        @if ($order->status === 'pending_payment')
            <p class="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Cette commande est en <strong>paiement en attente</strong>. Vous pouvez finaliser le Mobile Money depuis l’application ou l’API existante ; le paiement en direct depuis cette page arrive prochainement.
            </p>
        @endif
    </div>
</div>
