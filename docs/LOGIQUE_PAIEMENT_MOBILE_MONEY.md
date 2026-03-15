# Logique de paiement Mobile Money (Shwary)

Ce document décrit le flux complet du paiement : création de commande → initiation Shwary → callback webhook → mise à jour commande et affichage du code livraison.

---

## 1. Vue d’ensemble

```
[Client] → Crée commande (status: pending_payment, pas de code)
    ↓
[Client] → Clique « Payer avec Mobile Money » (numéro + pays)
    ↓
[Backend] → Appelle l’API Shwary (push sur le téléphone du client)
    ↓
[Backend] → Crée un enregistrement Payment (lien order_id + provider_payment_id)
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  SANDBOX / LOCAL : paiement considéré « complété » tout de suite  │
│  → génération du code livraison + order.status = pending          │
│  → la réponse HTTP contient déjà delivery_code                    │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION : Shwary envoie un push au téléphone                  │
│  → le client accepte/refuse dans son app Mobile Money            │
│  → Shwary appelle notre webhook POST /api/shwary/callback        │
│  → on met à jour Payment puis Order (code + status)              │
│  → le frontend fait du polling GET /api/orders jusqu’au code     │
└─────────────────────────────────────────────────────────────────┘
    ↓
[Client] → Voit le code de livraison (GX-XXXXXX) et peut le montrer au livreur
```

---

## 2. Création de la commande (Order)

**Où :** `OrderController::store`  
**Route :** `POST /api/orders`

- La commande est créée avec :
  - `status = 'pending_payment'`
  - `delivery_code = null` (le code n’existe pas tant que le paiement n’est pas confirmé)
  - `total_amount`, `points_earned`, etc.
- Aucun paiement n’est déclenché à ce stade. Le client est redirigé vers l’étape « Paiement » où il doit saisir son numéro Mobile Money et cliquer sur « Payer avec Mobile Money ».

---

## 3. Initiation du paiement (initiate-payment)

**Où :** `OrderController::initiatePayment`  
**Route :** `POST /api/orders/{id}/initiate-payment`  
**Body :** `{ "client_phone_number": "+243...", "country_code": "DRC" }`

### 3.1 Vérifications

- La commande appartient au client (ou admin).
- La commande est bien en `pending_payment` (sinon « déjà payée »).
- Shwary est configuré (`SHWARY_MERCHANT_ID` + `SHWARY_MERCHANT_KEY`).

### 3.2 Montant et numéro

- **Devise de la commande** : prise sur le premier plat (`order.items[0].menu.currency`) ou `SHWARY_DEFAULT_ORDER_CURRENCY` (ex. USD).
- **Montant envoyé à Shwary** : `ShwaryService::convertToLocalAmount()` :
  - Si la commande est déjà en devise locale (CDF, KES, UGX) → pas de conversion, montant plancher respecté.
  - Sinon (ex. USD) → `montant × taux` (ex. `SHWARY_RATE_USD_TO_CDF=2500`) pour obtenir des CDF.
- **Numéro** : normalisé en E.164 (ex. +243812345678) via `normalizePhoneNumber`.

### 3.3 Appel à Shwary

- `ShwaryService::initiatePayment(amountLocal, phone, countryCode, callbackUrl, metadata)`.
- En **sandbox** : `$client->sandboxPay(...)` → pas de vrai push, Shwary peut renvoyer un statut « complété » ou « pending » selon le SDK.
- En **production** : `$client->pay(...)` → Shwary envoie la demande de paiement sur le téléphone du client (Orange Money, M-Pesa, etc.).

L’URL de callback est soit `SHWARY_CALLBACK_URL`, soit `APP_URL + /api/shwary/callback`. En production, Shwary n’accepte que du **HTTPS**.

### 3.4 Enregistrement du paiement (table `payments`)

- On crée toujours un enregistrement `Payment` :
  - `order_id` = id de la commande
  - `provider = 'shwary'`
  - `provider_payment_id` = id de la transaction Shwary (servira à reconnaître le callback)
  - `amount`, `currency`, `status`, `raw_response`

### 3.5 Règle sandbox / local

- Si `SHWARY_SANDBOX=true` **ou** `APP_ENV=local` :
  - On force `payment.status = 'completed'`.
  - On génère tout de suite le `delivery_code` (GX-XXXXXX), on met la commande en `status = 'pending'`.
  - La réponse JSON contient déjà `delivery_code` et `payment_completed: true` → le frontend affiche directement l’écran « Commande confirmée » sans attendre le webhook.
- Sinon (production réelle) :
  - `payment.status` reste `pending` (ou ce que Shwary a renvoyé).
  - On ne génère **pas** encore le code. La commande reste en `pending_payment`.
  - La réponse ne contient pas de `delivery_code`. Le frontend affiche « Paiement en attente » et lance le **polling** (voir plus bas).

---

## 4. Callback webhook (production)

**Où :** `ShwaryController::callback`  
**Route :** `POST /api/shwary/callback` (sans auth ; Shwary appelle cette URL)

### 4.1 Sécurité

- Si `SHWARY_WEBHOOK_SECRET` est défini : vérification de la signature (ex. `X-Webhook-Signature` HMAC-SHA256 du body). Si invalide → 403.

### 4.2 Traitement du body

- Le body est parsé via `ShwaryService::parseWebhookPayload()` (format attendu par le SDK Shwary).
- On extrait : `id` (ou `transactionId`), `status`, `referenceId`, et éventuellement `isCompleted`, `isFailed`, `failureReason`.

### 4.3 Recherche du Payment

- On cherche un `Payment` dont `provider_payment_id` = `id` ou `referenceId` de la notification.
- Si aucun → on répond 200 avec un message (pour éviter les retries inutiles), et on log.

### 4.4 Mise à jour du Payment

- On met à jour `Payment` : `status` = `completed` ou `failed` (selon le statut Shwary / `isCompleted` / `isFailed`), et on stocke le payload dans `raw_response.last_callback`.

### 4.5 Si paiement complété et Payment lié à une commande

- Si `payment.status === 'completed'` et `payment.order` existe :
  - Si la commande est encore en `pending_payment` :
    - Génération d’un `delivery_code` unique (GX-XXXXXX).
    - Mise à jour de la commande : `status = 'pending'`, `delivery_code = ...`.
    - Notification (changement de statut).
- Ainsi, la **prochaine** fois que le frontend fera un `GET /api/orders`, il récupérera la commande avec `delivery_code` et `status !== 'pending_payment'` → le polling s’arrête et l’écran « Commande confirmée » s’affiche.

### 4.6 Abonnements

- Si le `Payment` est lié à un **abonnement** (`subscription_id`), on ne change pas le statut de l’abonnement ici : l’admin valide l’abonnement après examen (validation manuelle).

---

## 5. Frontend : affichage et polling

**Où :** `frontend-next/app/client/orders/create/page.jsx`

- Après `POST /api/orders/{id}/initiate-payment` :
  - Si la réponse contient `delivery_code` (sandbox/local ou réponse synchrone) → on affiche tout de suite l’étape 3 (code de livraison).
  - Sinon → on affiche « Paiement en attente » et on lance `startPollingOrderStatus(order.id)` :
    - Toutes les 3 secondes, `GET /api/orders`.
    - On cherche la commande par `id` ou `uuid`.
    - Dès que `order.delivery_code` est présent et `order.status !== 'pending_payment'`, on arrête le polling, on met à jour le state et on affiche l’écran avec le code.
- Maximum 60 tentatives (~ 3 minutes) puis arrêt du polling.

---

## 6. Récapitulatif des statuts

| Étape              | Order.status      | Order.delivery_code | Payment.status |
|--------------------|-------------------|----------------------|----------------|
| Commande créée     | pending_payment   | null                 | —              |
| Paiement initié    | pending_payment   | null                 | pending        |
| Sandbox/local      | pending           | GX-XXXXXX            | completed      |
| Prod après webhook | pending           | GX-XXXXXX            | completed      |
| Échec (webhook)    | pending_payment   | null                 | failed         |

---

## 7. Points importants pour la production

1. **Callback URL** : `SHWARY_CALLBACK_URL` doit être en **HTTPS** (ex. `https://votre-domaine.com/api/shwary/callback`). Shwary n’appelle pas d’URL en HTTP.
2. **Webhook secret** : définir `SHWARY_WEBHOOK_SECRET` et vérifier la signature pour éviter les faux callbacks.
3. **Sandbox** : mettre `SHWARY_SANDBOX=false` et utiliser les identifiants Shwary **production**.
4. **Un seul paiement par commande** : l’initiate-payment refuse toute commande qui n’est plus en `pending_payment` ; une fois le code généré, on ne peut pas « re-payer » la même commande.
5. **Idempotence** : le callback vérifie `order.status === 'pending_payment'` avant de générer le code ; si le webhook est appelé deux fois pour la même transaction, le code n’est généré qu’une fois.

Ce document peut servir de base pour la **configuration production** (variables d’environnement, domaine, HTTPS, etc.).
