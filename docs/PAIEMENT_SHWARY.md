# Paiement Mobile Money

Cette note ne doit plus servir de guide de configuration.

Le provider actif du projet est **pawaPay**.

Documents à utiliser :

- `docs/WEBHOOK_PAWAPAY.md`
- `docs/DEPLOY_RENDER.md`
- `docs/API.md`

Rappel du flux actuel :

1. création de commande ou d’abonnement
2. initiation du dépôt via `pawaPay`
3. callback `POST /api/pawapay/callback`
4. fallback par `CheckPendingPaymentsJob`
5. mise à jour du paiement et de la commande ou de l’abonnement
