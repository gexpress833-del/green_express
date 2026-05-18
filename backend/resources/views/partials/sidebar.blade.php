@php
    $user = auth()->user();
    $role = $user?->role ?? 'guest';
    $roleLabel = config('roles.roles.'.$role.'.label', ucfirst($role));
    $navLinks = \App\Support\NavLinks::forRole($role);
    $currentPath = request()->path();
    $sidebarBrandHref = ($role === 'client' && Route::has('client.menus'))
        ? route('client.menus')
        : route('dashboard');
@endphp

{{-- Mobile overlay backdrop --}}
<div
    x-show="sidebarOpen"
    x-transition.opacity.duration.200ms
    x-cloak
    class="fixed inset-0 z-40 bg-black/50 lg:hidden"
    @click="sidebarOpen = false"
></div>

{{-- Sidebar --}}
<aside
    x-data="{ darkMode: $store.darkMode || { dark: false, toggle: () => {} } }"
    class="fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full transform flex-col border-r border-zinc-200 bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none dark:border-zinc-800 dark:bg-zinc-900"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
>
    {{-- Logo / Header --}}
    <div class="flex h-16 items-center justify-between border-b border-zinc-100 px-5 dark:border-zinc-800">
        <a href="{{ $sidebarBrandHref }}" class="flex items-center gap-2.5">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-lg text-white shadow-sm">🍃</span>
            <span class="text-lg font-bold text-emerald-700 tracking-tight dark:text-emerald-400">Green Express</span>
        </a>
        <div class="flex items-center gap-2">
            <button
                @click="darkMode.toggle()"
                class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Changer de thème"
                title="Mode sombre/clair"
            >
                <svg x-show="!darkMode.dark" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
                <svg x-show="darkMode.dark" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
            </button>
            <button
                @click="sidebarOpen = false"
                class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Fermer le menu"
            >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
        </div>
    </div>

    {{-- User info --}}
    <div class="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <p class="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ $user?->name ?? 'Invité' }}</p>
        <p class="mt-0.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-600/30">
            {{ $roleLabel }}
        </p>
    </div>

    {{-- Navigation --}}
    <nav class="flex-1 overflow-y-auto px-3 py-4">
        <ul class="space-y-0.5">
            @foreach ($navLinks as $link)
                @if ($link['label'] === 'Déconnexion')
                    @continue
                @endif

                @php
                    $href = $link['href'];
                    $isActive = false;
                    if ($href !== '#' && !($link['soon'] ?? false)) {
                        $linkPath = ltrim(parse_url($href, PHP_URL_PATH) ?? $href, '/');
                        $isActive = $currentPath === $linkPath || ($linkPath !== '' && str_starts_with($currentPath, $linkPath));
                    }
                @endphp

                <li>
                    @if ($link['soon'] ?? false)
                        <span
                            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed dark:text-zinc-600"
                            title="Bientôt disponible"
                        >
                            <span class="text-base shrink-0 opacity-50">&#9679;</span>
                            <span class="truncate">{{ $link['label'] }}</span>
                            <span class="ml-auto text-[10px] font-medium uppercase tracking-wide text-zinc-300 dark:text-zinc-600">Bientôt</span>
                        </span>
                    @else
                        <a
                            href="{{ $href }}"
                            @click="sidebarOpen = false"
                            @class([
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                                'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-600/30' => $isActive,
                                'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100' => ! $isActive,
                            ])
                        >
                            <span class="text-base shrink-0 {{ $isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500' }}">&#9679;</span>
                            <span class="truncate">{{ $link['label'] }}</span>
                        </a>
                    @endif
                </li>
            @endforeach
        </ul>
    </nav>

    {{-- Logout (bottom) --}}
    <div class="border-t border-zinc-100 p-3 dark:border-zinc-800">
        <form method="POST" action="{{ route('logout') }}" class="block">
            @csrf
            <button
                type="submit"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
                <span class="text-base shrink-0 text-zinc-400 dark:text-zinc-600">&#9679;</span>
                <span>Déconnexion</span>
            </button>
        </form>
    </div>
</aside>
