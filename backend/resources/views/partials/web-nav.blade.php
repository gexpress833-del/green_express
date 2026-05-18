@auth
    @php
        $role = auth()->user()->role ?? null;
    @endphp
    <header class="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div class="mx-auto max-w-7xl px-4 py-3">
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:flex-none sm:gap-x-4">
                    <a
                        href="{{ $role === 'client' && Route::has('client.menus') ? route('client.menus') : route('dashboard') }}"
                        class="shrink-0 text-lg font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                        {{ config('app.name', 'Green Express') }}
                    </a>

                    @if ($role === 'client')
                        <span class="hidden h-5 w-px shrink-0 bg-zinc-200 sm:block" aria-hidden="true"></span>
                        <nav class="flex w-full min-w-0 flex-wrap items-center gap-1 sm:w-auto" aria-label="Espace client">
                            <a
                                href="{{ Route::has('client.home') ? route('client.home') : route('dashboard') }}"
                                class="rounded-lg px-3 py-2 text-sm font-medium transition {{ request()->routeIs('client.home') ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' }}"
                            >
                                Accueil
                            </a>
                            <a
                                href="{{ route('client.menus') }}"
                                class="rounded-lg px-3 py-2 text-sm font-medium transition {{ request()->routeIs('client.menus') ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' }}"
                            >
                                Menus
                            </a>
                            <a
                                href="{{ route('client.cart') }}"
                                class="rounded-lg px-3 py-2 text-sm font-medium transition {{ request()->routeIs('client.cart') ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' }}"
                            >
                                Panier
                            </a>
                            <a
                                href="{{ route('client.orders.index') }}"
                                class="rounded-lg px-3 py-2 text-sm font-medium transition {{ request()->routeIs('client.orders.index') || request()->routeIs('client.orders.show') ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' }}"
                            >
                                Mes commandes
                            </a>
                        </nav>
                    @endif
                </div>

                <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <span class="hidden max-w-[10rem] truncate text-sm text-zinc-600 sm:inline md:max-w-xs">{{ auth()->user()->name }}</span>
                    <span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                        {{ $role ?? '—' }}
                    </span>
                    <form method="POST" action="{{ route('logout') }}" class="inline">
                        @csrf
                        <button type="submit" class="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
                            Déconnexion
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </header>
@endauth
