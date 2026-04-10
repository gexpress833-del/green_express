<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->login()
            ->brandName('Green Express')
            ->brandLogo(asset('Logo_gexpress.jpg'))
            ->brandLogoHeight('3rem')
            ->colors([
                'primary' => Color::Amber,
                'success' => Color::Green,
                'warning' => Color::Orange,
                'danger' => Color::Red,
                'info' => Color::Blue,
            ])
            ->darkMode(false)
            ->sidebarCollapsibleOnDesktop()
            ->navigationGroups([
                'Gestion',
                'Configuration',
            ])
            ->resources([
                \App\Filament\Resources\MenuResource::class,
                \App\Filament\Resources\EventTypeResource::class,
            ])
            ->pages([
                Pages\Dashboard::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
