<?php

namespace Tests\Feature;

use App\Jobs\CheckPendingPaymentsJob;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\AppNotificationService;
use App\Services\FlexPayService;
use App\Services\OrderNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tests\TestCase;

class FlexPayPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Log::spy();
        Config::set('flexpay.webhook_secret', null);
    }

    public function test_webhook_completed_met_a_jour_le_paiement_et_la_commande_en_paid(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'pending_payment',
            'total_amount' => 10000,
            'delivery_address' => 'Test address',
        ]);

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'flexpay',
            'provider_payment_id' => 'tx-123',
            'reference_id' => 'ref-123',
            'amount' => 10000,
            'currency' => 'CDF',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/flexpay/callback', [
            'code' => 0,
            'orderNumber' => 'tx-123',
            'reference' => 'ref-123',
        ]);

        $response->assertStatus(200)->assertJson(['message' => 'OK']);

        $payment = Payment::where('provider_payment_id', 'tx-123')->first();
        $order->refresh();

        $this->assertSame('completed', $payment->status);
        $this->assertSame('paid', $order->status);
        $this->assertNotNull($order->delivery_code);
    }

    public function test_webhook_failed_met_a_jour_le_paiement_et_annule_la_commande(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'pending_payment',
            'total_amount' => 10000,
            'delivery_address' => 'Test address',
        ]);

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'flexpay',
            'provider_payment_id' => 'tx-456',
            'reference_id' => 'ref-456',
            'amount' => 10000,
            'currency' => 'CDF',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/flexpay/callback', [
            'code' => 1,
            'orderNumber' => 'tx-456',
            'reference' => 'ref-456',
            'message' => 'insufficient_funds',
        ]);

        $response->assertStatus(200)->assertJson(['message' => 'OK']);

        $payment = Payment::where('provider_payment_id', 'tx-456')->first();
        $order->refresh();

        $this->assertSame('failed', $payment->status);
        $this->assertSame('insufficient_funds', $payment->failure_reason);
        $this->assertSame('cancelled', $order->status);
    }

    public function test_job_de_fallback_met_a_jour_les_paiements_pending_quand_le_webhook_est_perdu(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'pending_payment',
            'total_amount' => 10000,
            'delivery_address' => 'Test address',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'flexpay',
            'provider_payment_id' => 'tx-pending',
            'reference_id' => 'ref-pending',
            'amount' => 10000,
            'currency' => 'CDF',
            'status' => 'pending',
            'created_at' => now()->subMinutes(2),
        ]);

        $fakeFlex = $this->createMock(FlexPayService::class);
        $fakeFlex->method('checkTransaction')
            ->with('tx-pending')
            ->willReturn([
                'paid' => true,
                'failed' => false,
                'raw' => ['transaction' => ['status' => 0]],
            ]);
        App::instance(FlexPayService::class, $fakeFlex);

        $job = new CheckPendingPaymentsJob;
        $job->handle(
            $fakeFlex,
            App::make(OrderNotificationService::class),
            App::make(AppNotificationService::class),
        );

        $payment->refresh();
        $order->refresh();

        $this->assertSame('completed', $payment->status);
        $this->assertSame('paid', $order->status);
        $this->assertNotNull($order->delivery_code);
        $this->assertNotNull($payment->last_checked_at);
        $this->assertGreaterThanOrEqual(1, $payment->retry_count);
    }
}
