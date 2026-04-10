<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Menu;
use App\Models\Promotion;
use App\Models\PromotionClaim;
use App\Models\Point;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificateurControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_verificateur_can_validate_ticket(): void
    {
        $verificateur = User::factory()->create(['role' => 'verificateur']);
        $menu = Menu::factory()->create();
        $promo = Promotion::factory()->create(['menu_id' => $menu->id]);
        $claim = PromotionClaim::create([
            'user_id' => User::factory()->create()->id,
            'promotion_id' => $promo->id,
            'points_deducted' => 0,
            'status' => 'claimed',
            'ticket_code' => 'GXT-ABC12345',
        ]);

        $response = $this->actingAs($verificateur, 'api')
            ->postJson('/api/verificateur/validate-ticket', [
                'ticket_code' => 'GXT-ABC12345',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('valid', true);
        $response->assertJsonPath('message', 'Ticket validé avec succès.');

        $claim->refresh();
        $this->assertEquals('validated', $claim->status);
        $this->assertNotNull($claim->validated_at);
    }

    public function test_validate_ticket_already_validated_returns_success(): void
    {
        $verificateur = User::factory()->create(['role' => 'verificateur']);
        $claim = PromotionClaim::create([
            'user_id' => User::factory()->create()->id,
            'promotion_id' => Promotion::factory()->create()->id,
            'status' => 'validated',
            'ticket_code' => 'GXT-USED1234',
            'validated_at' => now(),
        ]);

        $response = $this->actingAs($verificateur, 'api')
            ->postJson('/api/verificateur/validate-ticket', [
                'ticket_code' => 'GXT-USED1234',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('valid', true);
        $response->assertJsonPath('message', 'Ce ticket a déjà été validé.');
    }

    public function test_validate_unknown_ticket_returns_404(): void
    {
        $verificateur = User::factory()->create(['role' => 'verificateur']);

        $response = $this->actingAs($verificateur, 'api')
            ->postJson('/api/verificateur/validate-ticket', [
                'ticket_code' => 'GXT-INVALID1',
            ]);

        $response->assertStatus(404);
        $response->assertJsonPath('valid', false);
    }

    public function test_verificateur_stats_return_counts(): void
    {
        $verificateur = User::factory()->create(['role' => 'verificateur']);
        PromotionClaim::create([
            'user_id' => User::factory()->create()->id,
            'promotion_id' => Promotion::factory()->create()->id,
            'status' => 'validated',
            'ticket_code' => 'GXT-STATS01',
            'validated_at' => now(),
        ]);
        PromotionClaim::create([
            'user_id' => User::factory()->create()->id,
            'promotion_id' => Promotion::factory()->create()->id,
            'status' => 'claimed',
            'ticket_code' => 'GXT-STATS02',
        ]);

        $response = $this->actingAs($verificateur, 'api')
            ->getJson('/api/verificateur/stats');

        $response->assertStatus(200);
        $response->assertJsonPath('validated', 1);
        $response->assertJsonPath('pending', 1);
    }
}
