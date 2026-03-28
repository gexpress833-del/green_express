<?php

namespace Tests\Feature;

use App\Jobs\CheckPendingPaymentsJob;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\OrderNotificationService;
use App\Services\ShwaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tests\TestCase;

class ShwaryPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Log::spy();
        Config::set('shwary.webhook_secret', null);
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

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'shwary',
            'provider_payment_id' => 'tx-123',
            'reference_id' => 'ref-123',
            'amount' => 10000,
            'currency' => 'CDF',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/shwary/callback', [
            'id' => 'tx-123',
            'referenceId' => 'ref-123',
            'status' => 'completed',
        ]);

        $response->assertStatus(200)->assertJson(['message' => 'OK']);

        $payment->refresh();
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

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'shwary',
            'provider_payment_id' => 'tx-456',
            'reference_id' => 'ref-456',
            'amount' => 10000,
            'currency' => 'CDF',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/shwary/callback', [
            'id' => 'tx-456',
            'referenceId' => 'ref-456',
            'status' => 'failed',
            'failureReason' => 'insufficient_funds',
        ]);

        $response->assertStatus(200)->assertJson(['message' => 'OK']);

        $payment->refresh();
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
            'provider' => 'shwary',
            'provider_payment_id' => 'tx-pending',
            'reference_id' => 'ref-pending',
            'amount' => 10000,
            'currency' => 'CDF',
            'status' => 'pending',
            'created_at' => now()->subMinutes(2),
        ]);

        $fakeShwary = $this->createMock(ShwaryService::class);
        $fakeShwary->method('getTransactionStatus')
            ->with('tx-pending')
            ->willReturn([
                'status' => 'completed',
                'failureReason' => null,
            ]);
        App::instance(ShwaryService::class, $fakeShwary);

        $notifications = App::make(OrderNotificationService::class);

        $job = new CheckPendingPaymentsJob();
        $job->handle($fakeShwary, $notifications);

        $payment->refresh();
        $order->refresh();

        $this->assertSame('completed', $payment->status);
        $this->assertSame('paid', $order->status);
        $this->assertNotNull($order->delivery_code);
        $this->assertNotNull($payment->last_checked_at);
        $this->assertGreaterThanOrEqual(1, $payment->retry_count);
    }
}
