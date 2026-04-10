<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:admin {--email= : Admin email} {--password= : Admin password} {--name= : Admin name}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or update an administrator user (email, password)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email') ?? $this->ask('Email for admin');
        $password = $this->option('password') ?? $this->secret('Password for admin');
        $name = $this->option('name') ?? $this->ask('Name for admin', 'Admin');

        if (! $email || ! $password) {
            $this->error('Email and password are required');
            return 1;
        }

        $user = User::where('email', $email)->first();
        if ($user) {
            $user->name = $name;
            $user->password = Hash::make($password);
            $user->role = 'admin';
            $user->save();
            $this->info('Admin user updated: '.$email);
        } else {
            User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
            ]);
            $this->info('Admin user created: '.$email);
        }

        return 0;
    }
}
