<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * Cycle complet FlexPay en environnement de test : mock HTTP (pas d’appel réel à FlexPaie).
 *
 * 1) Initiation via les routes API (commande ou abonnement)
 * 2) Paiement créé en pending avec provider flexpay
 * 3) Webhook POST /api/flexpay/callback (succès ou échec)
 * 4) Vérification des statuts Order / Subscription / Payment
 */
class FlexPayFullCycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Log::spy();
        Config::set([
            'flexpay.mock' => true,
            'flexpay.webhook_secret' => null,
            'flexpay.merchant' => 'TEST_MERCHANT',
            'flexpay.token' => 'test-token',
            'flexpay.min_amount_cdf' => 2900,
            'flexpay.rate_usd_to_cdf' => 2800,
        ]);
    }

    public function test_cycle_commande_initiate_puis_webhook_succes(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $menu = Menu::factory()->create([
            'created_by' => $user->id,
            'currency' => 'CDF',
            'price' => 5000,
            'status' => 'approved',
        ]);

        $orderRes = $this->actingAs($user, 'api')->postJson('/api/orders', [
            'items' => [
                ['menu_id' => $menu->id, 'quantity' => 1],
            ],
            'delivery_address' => 'Kinshasa, Gombe',
            'client_phone_number' => '0812345678',
        ]);

        $orderRes->assertStatus(201);
        $orderId = $orderRes->json('id');
        $this->assertNotNull($orderId);

        $initRes = $this->actingAs($user, 'api')->postJson("/api/orders/{$orderId}/initiate-payment", [
            'client_phone_number' => '0812345678',
            'country_code' => 'DRC',
        ]);

        $initRes->assertStatus(200)
            ->assertJsonPath('payment.provider', 'flexpay')
            ->assertJsonPath('payment.status', 'pending');

        $payment = Payment::where('order_id', $orderId)->first();
        $this->assertNotNull($payment);
        $this->assertSame('flexpay', $payment->provider);
        $this->assertStringStartsWith('mock_', (string) $payment->provider_payment_id);

        $this->postJson('/api/flexpay/callback', [
            'code' => 0,
            'orderNumber' => $payment->provider_payment_id,
            'reference' => $payment->reference_id,
        ])->assertStatus(200)->assertJson(['message' => 'OK']);

        $order = Order::findOrFail($orderId);
        $this->assertSame('paid', $order->status);
        $this->assertNotNull($order->delivery_code);
        $this->assertStringStartsWith('GX-', (string) $order->delivery_code);

        $payment->refresh();
        $this->assertSame('completed', $payment->status);
    }

    public function test_cycle_commande_webhook_echec_annule_la_commande(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $menu = Menu::factory()->create([
            'created_by' => $user->id,
            'currency' => 'CDF',
            'price' => 5000,
            'status' => 'approved',
        ]);

        $orderRes = $this->actingAs($user, 'api')->postJson('/api/orders', [
            'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            'delivery_address' => 'Kinshasa',
            'client_phone_number' => '0812345678',
        ]);
        $orderRes->assertStatus(201);
        $orderId = $orderRes->json('id');

        $this->actingAs($user, 'api')->postJson("/api/orders/{$orderId}/initiate-payment", [
            'client_phone_number' => '0812345678',
            'country_code' => 'DRC',
        ])->assertStatus(200);

        $payment = Payment::where('order_id', $orderId)->firstOrFail();

        $this->postJson('/api/flexpay/callback', [
            'code' => 1,
            'orderNumber' => $payment->provider_payment_id,
            'reference' => $payment->reference_id,
            'message' => 'insufficient_funds',
        ])->assertStatus(200);

        $this->assertSame('failed', $payment->fresh()->status);
        $this->assertSame('cancelled', Order::findOrFail($orderId)->status);
    }

    public function test_cycle_abonnement_initiate_puis_webhook_succes_planifie(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $plan = SubscriptionPlan::create([
            'name' => 'Plan test FlexPay',
            'description' => 'Test',
            'plan_scope' => SubscriptionPlan::SCOPE_INDIVIDUAL,
            'meal_types' => [],
            'highlights' => [],
            'price_week' => 25000,
            'price_month' => 100000,
            'currency' => 'CDF',
            'days_per_week' => 5,
            'days_per_month' => 20,
            'is_active' => true,
            'sort_order' => 99,
        ]);

        $subRes = $this->actingAs($user, 'api')->postJson('/api/subscriptions', [
            'subscription_plan_id' => $plan->id,
            'period' => 'week',
        ]);
        $subRes->assertStatus(201);
        $subscriptionId = $subRes->json('id');

        $initRes = $this->actingAs($user, 'api')->postJson("/api/subscriptions/{$subscriptionId}/initiate-payment", [
            'client_phone_number' => '0812345678',
            'country_code' => 'DRC',
        ]);

        $initRes->assertStatus(200)
            ->assertJsonPath('payment.provider', 'flexpay')
            ->assertJsonPath('payment.status', 'pending');

        $payment = Payment::where('subscription_id', $subscriptionId)->first();
        $this->assertNotNull($payment);
        $this->assertNull($payment->order_id);

        $this->postJson('/api/flexpay/callback', [
            'code' => 0,
            'orderNumber' => $payment->provider_payment_id,
            'reference' => $payment->reference_id,
        ])->assertStatus(200);

        $sub = Subscription::findOrFail($subscriptionId);
        $this->assertSame(Subscription::STATUS_SCHEDULED, $sub->status);
        $this->assertNotNull($sub->started_at);
        $this->assertNotNull($sub->expires_at);

        $this->assertSame('completed', $payment->fresh()->status);
    }

    public function test_flexpay_service_mock_initie_et_parse_webhook(): void
    {
        $svc = app(\App\Services\FlexPayService::class);

        $this->assertTrue($svc->isConfigured());

        $out = $svc->initiateMobilePayment(
            5000,
            'CDF',
            '243812345678',
            'REF-UNIT-TEST',
            'Description test'
        );

        $this->assertArrayHasKey('id', $out);
        $this->assertSame('pending', $out['status']);
        $this->assertSame('REF-UNIT-TEST', $out['referenceId']);

        $parsed = $svc->parseWebhookPayload([
            'code' => 0,
            'orderNumber' => $out['id'],
            'reference' => 'REF-UNIT-TEST',
        ]);
        $this->assertNotNull($parsed);
        $this->assertTrue($parsed['success']);
        $this->assertFalse($parsed['failure']);
    }
}
