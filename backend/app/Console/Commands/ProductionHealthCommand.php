<?php

namespace App\Console\Commands;

use App\Models\Menu;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductionHealthCommand extends Command
{
    protected $signature = 'gx:production-health';

    protected $description = 'Résumé santé base : volumes (users, menus, plans) + connexion DB masquée';

    public function handle(): int
    {
        $default = (string) config('database.default');
        $conn = config("database.connections.{$default}") ?? [];
        $driver = (string) ($conn['driver'] ?? '');

        $this->line('<fg=cyan>Green Express — gx:production-health</>');
        $this->newLine();
        $this->line('Connexion : <fg=yellow>'.$default.'</> (driver: '.$driver.')');
        $this->line('Base cible : '.$this->formatDbTarget($conn));
        $this->line('APP_URL : '.(string) config('app.url'));
        $this->newLine();

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $this->error('Connexion DB impossible : '.$e->getMessage());

            return 1;
        }

        $rows = [
            ['users', $this->safeCount(fn () => User::query()->count())],
            ['menus', $this->safeCount(fn () => Menu::query()->count())],
            ['subscription_plans', $this->safeCount(fn () => SubscriptionPlan::query()->count())],
            ['subscriptions', $this->safeCount(fn () => Subscription::query()->count())],
            ['event_types', $this->safeCountTable('event_types')],
            ['orders', $this->safeCountTable('orders')],
            ['payments', $this->safeCountTable('payments')],
        ];

        $this->table(['Table / modèle', 'Lignes'], $rows);
        $this->newLine();
        $this->comment('Si les totaux sont à 0 alors que vous attendez des données : vérifiez DATABASE_URL / DB_URL (mauvaise instance ?) ou une base vidée (migrate:fresh).');

        return 0;
    }

    /**
     * @param  array<string, mixed>  $conn
     */
    private function formatDbTarget(array $conn): string
    {
        $url = $conn['url'] ?? null;
        if (is_string($url) && $url !== '') {
            return $this->maskDatabaseUrl($url);
        }

        $user = (string) ($conn['username'] ?? '');
        $host = (string) ($conn['host'] ?? '');
        $port = (string) ($conn['port'] ?? '');
        $db = (string) ($conn['database'] ?? '');

        return sprintf('%s@%s:%s / %s', $user !== '' ? $user : '?', $host !== '' ? $host : '?', $port !== '' ? $port : '?', $db !== '' ? $db : '?');
    }

    private function maskDatabaseUrl(string $url): string
    {
        // postgresql://user:secret@host:5432/dbname — masque le mot de passe
        $masked = preg_replace('#(://[^:]+:)([^@]+)(@)#', '$1***$3', $url);

        return is_string($masked) ? $masked : $url;
    }

    private function safeCountTable(string $table): string
    {
        if (! Schema::hasTable($table)) {
            return 'n/a';
        }

        return $this->safeCount(fn () => DB::table($table)->count());
    }

    private function safeCount(callable $fn): string
    {
        try {
            return (string) $fn();
        } catch (\Throwable) {
            return 'erreur';
        }
    }
}
