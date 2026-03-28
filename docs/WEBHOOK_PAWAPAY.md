# Webhook pawaPay (dépôts)

## URL à configurer (dashboard pawaPay → Deposits)

En production (ex. Render) :

```
https://green-express-rdc.onrender.com/api/pawapay/callback
```

Préfixe API Laravel : les routes dans `routes/api.php` sont montées sous `/api` (voir `bootstrap/app.php` ou `RouteServiceProvider`).

## Méthode

- `POST`
- Corps JSON : notamment `depositId` (UUID), `status` : `COMPLETED` | `PROCESSING` | `FAILED`

## Comportement backend

- Recherche du `Payment` avec `provider = pawapay` et `provider_payment_id` = `depositId`.
- `COMPLETED` : paiement complété ; si commande en `pending_payment` → `paid` + code livraison `GX-XXXXXX`.
- `FAILED` : paiement échoué ; commande associée → `cancelled`.
- `PROCESSING` : paiement laissé en `pending`.

## Variables d’environnement

Voir `backend/.env.example` :

- `PAWAPAY_API_TOKEN`
- `PAWAPAY_BASE_URL`
- `PAWAPAY_CALLBACK_URL`
- `PAWAPAY_TIMEOUT`
- `PAWAPAY_WEBHOOK_SECRET` si vous activez une validation complémentaire

Le jeton API sert aux appels **sortants** (`GET /v2/deposits/{id}` pour le job de relance). Le webhook est **appelé par pawaPay** vers votre URL ; la sécurité renforcée = rappels signés (RFC 9421) si activés dans le dashboard.

## Relance (polling)

`CheckPendingPaymentsJob` interroge `GET /v2/deposits/{depositId}` pour les paiements `provider = pawapay` encore en attente.

Le scheduler Laravel l’exécute chaque minute via Render Cron.
