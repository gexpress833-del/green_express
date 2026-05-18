<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? config('app.name', 'Green Express') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
    <style>[x-cloak] { display: none !important; }</style>
</head>
<body class="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100"
      x-data="{ sidebarOpen: false }"
      @keydown.escape.window="sidebarOpen = false">

    @auth
        <div class="flex min-h-screen">
            {{-- Sidebar --}}
            @include('partials.sidebar')

            {{-- Main content wrapper --}}
            <div class="flex flex-1 flex-col min-w-0">
                {{-- Mobile header --}}
                <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
                    <button
                        @click="sidebarOpen = true"
                        class="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        aria-label="Ouvrir le menu"
                    >
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    @php
                        $mobileBrandHref = (auth()->user()->role ?? null) === 'client' && Route::has('client.menus')
                            ? route('client.menus')
                            : route('dashboard');
                    @endphp
                    <a href="{{ $mobileBrandHref }}" class="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
                        {{ config('app.name', 'Green Express') }}
                    </a>
                    <div class="w-10"></div>
                </header>

                {{-- Desktop : raccourcis client (et en-tête compte) — mobile : menu latéral uniquement --}}
                <div class="hidden lg:block">
                    @include('partials.web-nav')
                </div>

                {{-- Page content --}}
                <main class="flex-1 p-4 sm:p-6 lg:p-8">
                    {{ $slot }}
                </main>
            </div>
        </div>
    @endauth

    @guest
        <main class="min-h-screen">
            {{ $slot }}
        </main>
    @endguest

    @livewireScripts
</body>
</html>
