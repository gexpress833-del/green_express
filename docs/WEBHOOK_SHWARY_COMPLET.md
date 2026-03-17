# Webhook Shwary – Contrôleur complet et configuration

## 1. Contrôleur webhook complet (Laravel)

**Fichier :** `backend/app/Http/Controllers/ShwaryController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\ShwaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\OrderNotificationService;

class ShwaryController extends Controller
{
    protected $shwaryService;

    public function __construct(ShwaryService $shwaryService, private OrderNotificationService $orderNotifications)
    {
        $this->shwaryService = $shwaryService;
    }

    /**
     * Webhook callback de Shwary
     * Reçoit les mises à jour de statut des transactions
     * Optionnel : vérification de signature si SHWARY_WEBHOOK_SECRET est défini
     */
    public function callback(Request $request)
    {
        try {
            $rawBody = $request->getContent();
            $secret = config('shwary.webhook_secret');
            if (!empty($secret)) {
                // Shwary envoie x-shwary-signature ; on accepte aussi X-Webhook-Signature / X-Signature
                $signature = $request->header('X-Shwary-Signature')
                    ?? $request->header('X-Webhook-Signature')
                    ?? $request->header('X-Signature');
                if (!$signature || !$this->verifyWebhookSignature($rawBody, $signature, $secret)) {
                    Log::warning('Shwary Callback: Invalid or missing signature');
                    return response()->json(['message' => 'Invalid signature'], 403);
                }
            }

            $data = $this->shwaryService->parseWebhookPayload($rawBody);

            if (!$data) {
                $data = $request->all();
            }

            Log::info('Shwary Callback Received', [
                'has_id' => isset($data['id']),
                'status' => $data['status'] ?? null,
            ]);

            $transactionId = $data['id'] ?? $data['transactionId'] ?? null;
            $status = $data['status'] ?? null;
            $referenceId = $data['referenceId'] ?? $transactionId;

            if (!$transactionId || $status === null) {
                Log::warning('Shwary Callback: Missing required fields', ['data' => $data]);
                return response()->json(['message' => 'Données invalides'], 400);
            }

            $payment = Payment::where('provider_payment_id', $transactionId)
                ->orWhere('provider_payment_id', $referenceId)
                ->first();

            if (!$payment) {
                Log::warning('Shwary Callback: Payment not found', [
                    'transaction_id' => $transactionId,
                    'reference_id' => $referenceId,
                ]);
                return response()->json(['message' => 'Payment not found'], 200);
            }

            $paymentStatus = $this->mapShwaryStatusToPaymentStatus($status);
            if (isset($data['isCompleted']) && $data['isCompleted']) {
                $paymentStatus = 'completed';
            }
            if (isset($data['isFailed']) && $data['isFailed']) {
                $paymentStatus = 'failed';
            }

            $payment->update([
                'status' => $paymentStatus,
                'raw_response' => array_merge($payment->raw_response ?? [], [
                    'last_callback' => $data,
                    'updated_at' => now()->toIso8601String(),
                ]),
            ]);

            if ($paymentStatus === 'completed' && $payment->order) {
                $order = $payment->order;
                if ($order->status === 'pending_payment') {
                    $oldStatus = (string) $order->status;
                    $deliveryCode = 'GX-' . strtoupper(Str::random(6));

                    // Vérifier l'unicité
                    while (Order::where('delivery_code', $deliveryCode)->exists()) {
                        $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                    }

                    $order->update([
                        'status' => 'pending',
                        'delivery_code' => $deliveryCode,
                    ]);

                    $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'pending');

                    Log::info('Shwary Payment Completed - Order Updated', [
                        'order_id' => $order->id,
                        'delivery_code' => $deliveryCode,
                    ]);
                }
            }

            if ($paymentStatus === 'failed' && $payment->order) {
                $order = $payment->order;
                Log::info('Shwary Payment Failed', [
                    'order_id' => $order->id,
                    'failure_reason' => $data['failureReason'] ?? 'Unknown',
                ]);
            }

            // Paiement abonnement : seul le paiement est enregistré ; l'admin valide l'abonnement après examen
            if ($paymentStatus === 'completed' && $payment->subscription_id) {
                Log::info('Subscription payment completed - awaiting admin validation', [
                    'subscription_id' => $payment->subscription_id,
                ]);
            }

            return response()->json(['message' => 'Callback processed'], 200);

        } catch (\Exception $e) {
            Log::error('Shwary Callback Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Retourner 200 pour éviter les retries excessifs
            return response()->json(['message' => 'Error processing callback'], 200);
        }
    }

    /**
     * Vérifier la signature HMAC-SHA256 du webhook Shwary.
     * Accepte x-shwary-signature en hex brut ou préfixé "sha256=".
     */
    private function verifyWebhookSignature(string $rawBody, string $signature, string $secret): bool
    {
        $expectedHex = hash_hmac('sha256', $rawBody, $secret);
        $expectedWithPrefix = 'sha256=' . $expectedHex;
        return hash_equals($expectedHex, $signature) || hash_equals($expectedWithPrefix, $signature);
    }

    /**
     * Mapper le statut Shwary vers le statut Payment
     */
    private function mapShwaryStatusToPaymentStatus($shwaryStatus)
    {
        return match($shwaryStatus) {
            'pending' => 'pending',
            'completed' => 'completed',
            'failed' => 'failed',
            default => 'pending',
        };
    }
}
```

**Route (dans `backend/routes/api.php`) :**

```php
// Webhook Shwary (public, protégé par signature si nécessaire)
Route::post('shwary/callback', [\App\Http\Controllers\ShwaryController::class, 'callback']);
```

---

## 2. Config webhook côté Shwary (ton app)

### 2.1 Fichier de config Laravel

**Fichier :** `backend/config/shwary.php` (extrait webhook)

```php
/*
| URL de callback webhook (obligatoirement HTTPS pour Shwary).
| En production : https://votre-domaine.com/api/shwary/callback
| En local : utiliser ngrok puis définir ex. SHWARY_CALLBACK_URL=https://xxx.ngrok.io/api/shwary/callback
*/
'callback_url' => env('SHWARY_CALLBACK_URL'),

/*
| Secret pour vérifier la signature des webhooks (recommandé en production).
| En-tête envoyé par Shwary : x-shwary-signature (HMAC-SHA256 du body en hex).
*/
'webhook_secret' => env('SHWARY_WEBHOOK_SECRET') ?? env('PAYMENT_WEBHOOK_SECRET'),
```

### 2.2 Variables d’environnement (.env)

À définir sur **Render** (ou ton hébergeur) et en local si tu testes le webhook :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SHWARY_CALLBACK_URL` | URL HTTPS que Shwary appellera pour les callbacks | `https://TON-BACKEND.onrender.com/api/shwary/callback` |
| `SHWARY_WEBHOOK_SECRET` | (Optionnel) Secret pour vérifier la signature du webhook | Valeur fournie par Shwary ou générée (ex. `php -r "echo bin2hex(random_bytes(32));"`) |
| `PAYMENT_WEBHOOK_SECRET` | Alternative à `SHWARY_WEBHOOK_SECRET` | Même usage |

- Si **aucun secret** n’est défini : le callback accepte les requêtes sans vérification de signature (utile si Shwary ne propose pas encore de clé dans le dashboard).
- Si **un secret** est défini : le contrôleur vérifie l’en-tête `X-Shwary-Signature` (ou `X-Webhook-Signature` / `X-Signature`) en HMAC-SHA256 du body ; si invalide → **403**.

### 2.3 Configuration dans le dashboard Shwary

À faire côté **Shwary** (tableau de bord / paramètres) :

1. **URL de callback (webhook)**  
   - Saisir l’URL **HTTPS** complète de ton API :  
     `https://TON-BACKEND.onrender.com/api/shwary/callback`  
   - (Remplacer `TON-BACKEND.onrender.com` par le vrai domaine de ton backend Render.)

2. **Secret webhook (si Shwary le propose)**  
   - Si Shwary permet de configurer un “Webhook secret” ou “Signing secret”, saisir la **même valeur** que `SHWARY_WEBHOOK_SECRET` (ou `PAYMENT_WEBHOOK_SECRET`) dans ton `.env`.  
   - Actuellement, la doc indique que Shwary ne propose pas toujours cette option ; dans ce cas, ne pas définir le secret côté app et le callback fonctionne sans signature.

### 2.4 Résumé

| Élément | Valeur |
|--------|--------|
| **Méthode** | `POST` |
| **URL complète** | `https://<ton-backend>/api/shwary/callback` |
| **En-têtes éventuels** | `X-Shwary-Signature` ou `X-Webhook-Signature` (HMAC-SHA256 du body, hex ou `sha256=...`) |
| **Body** | JSON parsé par `ShwaryService::parseWebhookPayload()` (SDK) : `id`, `status`, `referenceId`, etc. |

Après déploiement, vérifier dans les logs Laravel (`storage/logs/laravel.log`) les entrées **Shwary Callback Received** et **Shwary Payment Completed - Order Updated** pour confirmer que le webhook est bien appelé et que la commande est mise à jour.
