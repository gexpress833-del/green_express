<?php

namespace App\Livewire\Auth;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Connexion')]
class LoginForm extends Component
{
    public string $login = '';

    public string $password = '';

    public function authenticate(): void
    {
        $this->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [], [
            'login' => 'identifiant',
        ]);

        $login = trim($this->login);
        $credentials = filter_var($login, FILTER_VALIDATE_EMAIL)
            ? ['email' => $login, 'password' => $this->password]
            : ['phone' => \App\Services\PhoneRDCService::formatPhoneRDC($login), 'password' => $this->password];

        if (! Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'login' => 'Identifiants incorrects. Vérifiez l’e-mail ou le numéro et le mot de passe.',
            ]);
        }

        session()->regenerate();

        $user = Auth::guard('web')->user();
        $target = ($user && ($user->role ?? null) === 'client' && Route::has('client.menus'))
            ? route('client.menus')
            : route('dashboard');

        $this->redirect($target, navigate: false);
    }

    public function render()
    {
        return view('livewire.auth.login-form');
    }
}
