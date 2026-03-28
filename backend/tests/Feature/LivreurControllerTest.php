<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Point;
use App\Models\PointLedger;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LivreurControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_livreur_peut_valider_un_code_de_livraison_et_crediter_les_points(): void
    {
        $livreur = User::factory()->create(['role' => 'livreur']);
        $client = User::factory()->create(['role' => 'client']);
        $menu = Menu::factory()->create(['price' => 25]);

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $client->id,
            'livreur_id' => $livreur->id,
            'status' => 'pending',
            'total_amount' => 25,
            'delivery_address' => '123 Test St',
            'delivery_code' => 'GX-ABC123',
            'points_earned' => 10,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_id' => $menu->id,
            'quantity' => 1,
            'price' => 25,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'amount' => 25,
            'currency' => 'CDF',
            'status' => 'completed',
            'provider' => 'shwary',
            'provider_payment_id' => 'tx-123',
        ]);

        Point::create(['user_id' => $client->id, 'balance' => 50]);

        $response = $this->actingAs($livreur, 'api')
            ->postJson('/api/livreur/validate-code', [
                'code' => 'gx-abc123',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('valid', true);
        $response->assertJsonPath('points_earned', 10);

        $order->refresh();
        $this->assertSame('delivered', $order->status);
        $this->assertSame($livreur->id, $order->livreur_id);

        $point = Point::where('user_id', $client->id)->first();
        $this->assertSame(60, (int) $point->balance);

        $this->assertDatabaseHas('point_ledgers', [
            'order_id' => $order->id,
            'user_id' => $client->id,
            'delta' => 10,
        ]);
    }

    public function test_livreur_ne_peut_pas_valider_une_commande_non_attribuee(): void
    {
        $livreur = User::factory()->create(['role' => 'livreur']);
        $otherLivreur = User::factory()->create(['role' => 'livreur']);
        $client = User::factory()->create(['role' => 'client']);

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $client->id,
            'livreur_id' => $otherLivreur->id,
            'status' => 'pending',
            'total_amount' => 25,
            'delivery_address' => '123 Test St',
            'delivery_code' => 'GX-XYZ123',
            'points_earned' => 10,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'amount' => 25,
            'currency' => 'CDF',
            'status' => 'completed',
            'provider' => 'shwary',
            'provider_payment_id' => 'tx-456',
        ]);

        $response = $this->actingAs($livreur, 'api')
            ->postJson('/api/livreur/validate-code', [
                'code' => 'GX-XYZ123',
            ]);

        $response->assertStatus(403);
        $response->assertJsonPath('valid', false);

        $this->assertDatabaseMissing('point_ledgers', [
            'order_id' => $order->id,
            'user_id' => $client->id,
        ]);
    }
}

