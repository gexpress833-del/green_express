<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Menu;
use App\Models\Payment;
use App\Models\Point;
use App\Models\PointLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LivreurControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_livreur_can_validate_delivery_code_and_earn_points(): void
    {
        $livreur = User::factory()->create(['role' => 'livreur']);
        $client = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create();

        $order = Order::create([
            'uuid' => \Illuminate\Support\Str::uuid(),
            'user_id' => $client->id,
            'status' => 'pending',
            'total_amount' => 25.00,
            'delivery_address' => '123 Test St',
            'delivery_code' => 'GX-ABC123',
            'points_earned' => 10,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'menu_id' => $menu->id,
            'quantity' => 1,
            'price' => 25.00,
        ]);
        Payment::create([
            'order_id' => $order->id,
            'amount' => 25.00,
            'currency' => 'USD',
            'status' => 'completed',
            'provider' => 'shwary',
            'provider_payment_id' => 'tx-123',
        ]);
        Point::create(['user_id' => $client->id, 'balance' => 50]);

        $response = $this->actingAs($livreur, 'api')
            ->postJson('/api/livreur/validate-code', [
                'code' => 'GX-ABC123',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('valid', true);
        $response->assertJsonPath('points_earned', 10);

        $order->refresh();
        $this->assertEquals('delivered', $order->status);
        $this->assertEquals($livreur->id, $order->livreur_id);

        $point = Point::where('user_id', $client->id)->first();
        $this->assertEquals(60, $point->balance);
    }

    public function test_validate_invalid_code_returns_400(): void
    {
        $livreur = User::factory()->create(['role' => 'livreur']);
        // Code format valide (9 chars) mais inexistant en base
        $response = $this->actingAs($livreur, 'api')
            ->postJson('/api/livreur/validate-code', [
                'code' => 'GX-999999',
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('valid', false);
    }

    public function test_livreur_stats_filter_by_livreur(): void
    {
        $livreur = User::factory()->create(['role' => 'livreur']);
        Order::create([
            'uuid' => \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'livreur_id' => $livreur->id,
            'status' => 'delivered',
            'delivery_code' => 'GX-DEL001',
        ]);

        $response = $this->actingAs($livreur, 'api')
            ->getJson('/api/livreur/stats');

        $response->assertStatus(200);
        $response->assertJsonPath('delivered', 1);
    }
}
