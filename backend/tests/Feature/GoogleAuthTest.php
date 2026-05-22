<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Auth\GoogleAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_endpoint_creates_client_and_logs_in(): void
    {
        config(['services.google.client_id' => 'test-client-id.apps.googleusercontent.com']);

        Http::fake([
            'oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-client-id.apps.googleusercontent.com',
                'email' => 'nouveau@gmail.com',
                'email_verified' => 'true',
                'name' => 'Nouveau Client',
            ]),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'fake-id-token',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'nouveau@gmail.com')
            ->assertJsonPath('user.role', 'client');

        $this->assertDatabaseHas('users', [
            'email' => 'nouveau@gmail.com',
            'role' => 'client',
        ]);
    }

    public function test_google_endpoint_logs_in_existing_user(): void
    {
        config(['services.google.client_id' => 'test-client-id.apps.googleusercontent.com']);

        $user = User::factory()->create([
            'email' => 'existant@gmail.com',
            'role' => 'admin',
        ]);

        Http::fake([
            'oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-client-id.apps.googleusercontent.com',
                'email' => 'existant@gmail.com',
                'email_verified' => 'true',
                'name' => 'Admin',
            ]),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'fake-id-token',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'existant@gmail.com')
            ->assertJsonPath('user.role', 'admin');

        $this->assertEquals(1, User::where('email', 'existant@gmail.com')->count());
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_service_rejects_invalid_audience(): void
    {
        config(['services.google.client_id' => 'expected-client-id']);

        Http::fake([
            'oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'wrong-client-id',
                'email' => 'a@gmail.com',
                'email_verified' => 'true',
            ]),
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        app(GoogleAuthService::class)->authenticateFromIdToken('token');
    }
}
