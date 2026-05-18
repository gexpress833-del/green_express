<?php

namespace App\Livewire\Auth;

use App\Services\Auth\RegisterClientUserService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Créer un compte')]
class RegisterForm extends Component
{
    public string $name = '';

    public string $email = '';

    public string $password = '';

    public string $password_confirmation = '';

    public string $phone = '';

    public function register(RegisterClientUserService $registerClientUser): void
    {
        $this->validate(
            [
                'name' => ['required', 'string'],
                'email' => ['required', 'email', 'unique:users,email'],
                'password' => ['required', 'min:8', 'confirmed'],
                'phone' => ['required', 'string', 'max:30'],
            ],
            [
                'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
                'email.email' => 'Veuillez entrer une adresse e-mail valide.',
                'password.min' => 'Le mot de passe doit contenir au moins :min caractères.',
            ]
        );

        $user = $registerClientUser->create([
            'name' => $this->name,
            'email' => $this->email,
            'password' => $this->password,
            'phone' => $this->phone,
        ]);

        Auth::guard('web')->login($user);
        session()->regenerate();

        $target = (($user->role ?? null) === 'client' && Route::has('client.menus'))
            ? route('client.menus')
            : route('dashboard');

        $this->redirect($target, navigate: false);
    }

    public function render()
    {
        return view('livewire.auth.register-form');
    }
}
