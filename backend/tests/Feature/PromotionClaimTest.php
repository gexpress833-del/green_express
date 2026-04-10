<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Menu;
use App\Models\Promotion;
use App\Models\Point;
use App\Models\PromotionClaim;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromotionClaimTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();

        // Créer les rôles si nécessaire
        $this->withoutExceptionHandling();
    }

    public function test_user_can_claim_promotion()
    {
        // Setup
        $user = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create();
        $promo = Promotion::factory()->create([
            'menu_id' => $menu->id,
            'discount' => 10.0,
            'points_required' => 50,
            'quantity_limit' => 5,
            'start_at' => Carbon::now()->subDay(),
            'end_at' => Carbon::now()->addDay(),
        ]);

        // User a 120 points
        Point::create(['user_id' => $user->id, 'balance' => 120]);

        // Claim
        $response = $this->actingAs($user, 'api')
            ->postJson("/api/promotions/{$promo->id}/claim");

        // Assertions
        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Promotion réclamée avec succès');

        // Check PromotionClaim created with ticket_code
        $claim = PromotionClaim::where('user_id', $user->id)->where('promotion_id', $promo->id)->first();
        $this->assertNotNull($claim);
        $this->assertEquals('claimed', $claim->status);
        $this->assertNotEmpty($claim->ticket_code);
        $this->assertStringStartsWith('GXT-', $claim->ticket_code);

        // Check points deducted
        $user->refresh();
        $points = Point::where('user_id', $user->id)->first();
        $this->assertEquals(70, $points->balance);

        // Check quantity decremented
        $promo->refresh();
        $this->assertEquals(4, $promo->quantity_limit);
    }

    public function test_cannot_claim_without_enough_points()
    {
        $user = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create();
        $promo = Promotion::factory()->create([
            'menu_id' => $menu->id,
            'points_required' => 100,
            'quantity_limit' => 5,
        ]);

        // Only 50 points
        Point::create(['user_id' => $user->id, 'balance' => 50]);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/promotions/{$promo->id}/claim");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Points insuffisants');
    }

    public function test_cannot_claim_expired_promotion()
    {
        $user = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create();
        $promo = Promotion::factory()->create([
            'menu_id' => $menu->id,
            'points_required' => 50,
            'end_at' => Carbon::now()->subDay(),
        ]);

        Point::create(['user_id' => $user->id, 'balance' => 120]);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/promotions/{$promo->id}/claim");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Promotion expirée');
    }

    public function test_cannot_claim_out_of_stock_promotion()
    {
        $user = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create();
        $promo = Promotion::factory()->create([
            'menu_id' => $menu->id,
            'quantity_limit' => 0,
        ]);

        Point::create(['user_id' => $user->id, 'balance' => 120]);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/promotions/{$promo->id}/claim");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Promotion épuisée');
    }

    public function test_user_can_view_their_claims()
    {
        $user = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create();
        $promo = Promotion::factory()->create(['menu_id' => $menu->id]);
        
        PromotionClaim::create([
            'user_id' => $user->id,
            'promotion_id' => $promo->id,
            'status' => 'claimed',
        ]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/my-promotion-claims');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'claimed');
    }
}
