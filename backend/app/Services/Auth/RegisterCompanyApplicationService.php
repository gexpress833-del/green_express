<?php

namespace App\Services\Auth;

use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Inscription entreprise (B2B) : utilisateur contact + société en attente de validation admin.
 */
class RegisterCompanyApplicationService
{
    /**
     * @param  array{
     *     contact_name: string,
     *     contact_email: string,
     *     contact_password: string,
     *     company_name: string,
     *     institution_type: string,
     *     company_phone: string,
     *     company_address: string,
     *     employee_count: int,
     *     employees: array<int, array<string, mixed>>,
     * } $data
     */
    public function create(array $data): User
    {
        $user = null;
        try {
            $user = User::create([
                'name' => $data['contact_name'],
                'email' => $data['contact_email'],
                'password' => Hash::make($data['contact_password']),
                'role' => 'entreprise',
            ]);

            $slug = Str::slug($data['company_name']);
            Company::create([
                'name' => $data['company_name'],
                'slug' => $slug,
                'email' => $data['contact_email'],
                'phone' => $data['company_phone'],
                'address' => $data['company_address'],
                'institution_type' => $data['institution_type'],
                'employee_count' => $data['employee_count'],
                'pending_employees' => $data['employees'],
                'status' => 'pending',
                'contact_user_id' => $user->id,
            ]);

            return $user->fresh();
        } catch (\Throwable $e) {
            Log::error('❌ [RegisterCompanyApplicationService] '.$e->getMessage(), ['exception' => $e]);
            if ($user instanceof User) {
                $user->delete();
            }
            throw $e;
        }
    }
}
