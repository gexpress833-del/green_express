<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateProductionUsers extends Command
{
    protected $signature = 'create:production-users
                            {--password= : Mot de passe commun (sinon env PRODUCTION_SEED_PASSWORD)}
                            {--domain= : Domaine email (ex: greenexpress.com → admin@greenexpress.com)}
                            {--force : Mettre à jour le mot de passe des comptes existants}';

    protected $description = 'Crée un compte par rôle : admin, cuisinier, livreur, verificateur (validateur codes promo), client, entreprise';

    /** Rôles à créer : admin, cuisinier, livreur, verificateur, client, entreprise. */
    private const ROLES = ['admin', 'cuisinier', 'livreur', 'verificateur', 'client', 'entreprise'];

    public function handle(): int
    {
        $domain = $this->option('domain') ?? env('PRODUCTION_SEED_EMAIL_DOMAIN', 'greenexpress.com');
        $domain = preg_replace('/^@/', '', trim($domain));

        $password = $this->option('password') ?? env('PRODUCTION_SEED_PASSWORD');
        if (empty($password)) {
            $password = $this->secret('Mot de passe commun pour tous les comptes (min. 8 caractères)');
        }
        if (strlen($password) < 8) {
            $this->error('Le mot de passe doit faire au moins 8 caractères.');
            return 1;
        }

        $force = $this->option('force');
        $hash = Hash::make($password);

        $created = [];
        $updated = [];
        foreach (self::ROLES as $role) {
            $email = $role . '@' . $domain;
            $name = $this->roleLabel($role);
            $user = User::where('email', $email)->first();

            if ($user) {
                if ($force || $user->role !== $role) {
                    $user->role = $role;
                    $user->name = $name;
                    $user->password = $hash;
                    $user->save();
                    $updated[] = $email;
                } else {
                    $this->line("Déjà existant (inchangé) : {$email}");
                }
            } else {
                User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $hash,
                    'role' => $role,
                ]);
                $created[] = $email;
            }
        }

        if (count($created) > 0) {
            $this->info('Comptes créés : ' . implode(', ', $created));
        }
        if (count($updated) > 0) {
            $this->info('Comptes mis à jour : ' . implode(', ', $updated));
        }

        $this->newLine();
        $this->table(
            ['Rôle', 'Email', 'Connexion front'],
            collect(self::ROLES)->map(fn ($r) => [
                $this->roleLabel($r),
                $r . '@' . $domain,
                '/login → ' . $r,
            ])->toArray()
        );
        $this->line('Mot de passe commun pour tous : (celui que vous avez saisi ou PRODUCTION_SEED_PASSWORD)');
        $this->warn('Changez ces mots de passe après la première connexion en production.');

        return 0;
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            'admin' => 'Administrateur',
            'cuisinier' => 'Cuisinier',
            'client' => 'Client',
            'livreur' => 'Livreur',
            'verificateur' => 'Validateur codes promo',
            'entreprise' => 'Chef entreprise',
            default => ucfirst($role),
        };
    }
}
