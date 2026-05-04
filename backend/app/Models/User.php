<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    use HasFactory, Notifiable, InteractsWithMedia, HasApiTokens, HasRoles;

    /**
     * Force Spatie Permission à résoudre les permissions sur le guard « web » (catalogue
     * seedé dans RolesAndPermissionsSeeder). Sinon les routes auth:api utilisent le guard
     * « api » et hasPermissionTo('…') lève PermissionDoesNotExist si les lignes guard api manquent.
     */
    protected string $guard_name = 'web';

    protected static function booted(): void
    {
        static::saved(function (User $user) {
            if (! $user->wasRecentlyCreated && ! $user->wasChanged('role')) {
                return;
            }
            $roleName = $user->role ?: 'client';
            if (\Spatie\Permission\Models\Role::where('name', $roleName)->where('guard_name', 'web')->exists()) {
                $user->syncRoles([$roleName]);
            }
        });
    }

    /**
     * Vérifie une permission Spatie pour un compte dont le rôle applicatif est admin.
     */
    public function canAsAdmin(string $permission): bool
    {
        if ($this->role !== 'admin') {
            return false;
        }

        return $this->safeHasPermissionTo($permission) === true;
    }

    /**
     * Vérifie une permission sans lever d'exception si la ligne n'existe pas en base (seed manquant).
     *
     * @return bool|null true = autorisé, false = refusé, null = permission absente de la table `permissions`
     */
    public function safeHasPermissionTo(string $name): ?bool
    {
        $perm = Permission::query()
            ->where('name', $name)
            ->where('guard_name', 'web')
            ->first();

        if (! $perm) {
            return null;
        }

        return $this->hasPermissionTo($perm);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar_url',
        'password',
        'role',
        'company_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'media',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * Téléphone normalisé (243…) pour connexion ; peut être null si uniquement e-mail.
     */
    public function setPhoneAttribute(?string $value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['phone'] = null;

            return;
        }
        $this->attributes['phone'] = \App\Services\PhoneRDCService::formatPhoneRDC($value);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function points()
    {
        return $this->hasOne(Point::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')->singleFile();
    }
}
