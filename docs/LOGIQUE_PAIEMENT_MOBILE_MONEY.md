# Logique de paiement Mobile Money

Le flux courant utilise **pawaPay** pour les commandes et les abonnements.

---

## 1. Vue d’ensemble

1. le client crée une commande ou une demande d’abonnement
2. il initie le paiement avec son numéro Mobile Money
3. le backend crée un dépôt `pawaPay`
4. un enregistrement `payments` est créé avec `provider = pawapay`
5. `pawaPay` envoie un callback sur `POST /api/pawapay/callback`
6. si le callback manque, `CheckPendingPaymentsJob` interroge `GET /v2/deposits/{depositId}`
7. le paiement passe à `completed` ou `failed`

---

## 2. Commandes

- création : `POST /api/orders`
- initiation paiement : `POST /api/orders/{id}/initiate-payment`
- le dépôt utilise :
  - `depositId`
  - `amount`
  - `currency`
  - `country`
  - `payer.accountDetails.phoneNumber`
  - `payer.accountDetails.provider`

Si le paiement est confirmé :

- `payments.status = completed`
- `orders.status = paid`
- `orders.delivery_code` est généré

Si le paiement échoue :

- `payments.status = failed`
- `orders.status = cancelled`

---

## 3. Abonnements

- création : `POST /api/subscriptions`
- initiation paiement : `POST /api/subscriptions/{id}/initiate-payment`

Le paiement d’abonnement suit le même principe que la commande, avec stockage dans `payments.subscription_id`.

---

## 4. Webhook

Route active :

`POST /api/pawapay/callback`

Statuts gérés :

- `COMPLETED`
- `FAILED`
- `PROCESSING`

Le contrôleur met à jour le paiement local puis la commande liée si nécessaire.

---

## 5. Fallback scheduler

Le scheduler Laravel exécute `CheckPendingPaymentsJob` chaque minute.

Ce job :

- récupère les paiements `pawapay` encore en `pending`
- appelle `PawaPayService::getDepositStatus(...)`
- applique la même logique métier que le webhook

---

## 6. Références

- `docs/WEBHOOK_PAWAPAY.md`
- `docs/DEPLOY_RENDER.md`
- `docs/API.md`
