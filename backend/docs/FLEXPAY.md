# FlexPay / FlexPaie (Infoset) — intégration

## Compte & secrets

- Espace marchand : [marchand.flexpay.cd](https://marchand.flexpay.cd)
- **`FLEXPAY_MERCHANT`** : code marchand FlexPaie.
- **`FLEXPAY_TOKEN`** : jeton JWT **Bearer** fourni par FlexPaie (valeur seule ou avec préfixe `Bearer ` — les deux sont acceptés côté backend). **Ne jamais committer** le jeton dans le dépôt.

## Endpoints (production)

| Usage | URL |
|--------|-----|
| Paiement Mobile Money | `POST {base}/paymentService` avec `base = https://backend.flexpay.cd/api/rest/v1` |
| Paiement carte | `POST https://cardpayment.flexpay.cd/v1.1/pay` (référence ; non branché dans l’app Laravel actuelle) |
| Vérification transaction | `GET {checkBase}/check/{ORDER_NUMBER}` avec `checkBase = https://apicheck.flexpaie.com/api/rest/v1` |

En **dev** (`FLEXPAY_ENV=dev`), les défauts pointent vers `beta-backend.flexpay.cd` pour le paiement et la vérif ; en **prod** (`FLEXPAY_ENV=prod`), la **vérification** utilise par défaut **`apicheck.flexpaie.com`** (mail Infoset / FlexPaie).

Surcharge possible : `FLEXPAY_PAYMENT_BASE_URL`, `FLEXPAY_CHECK_BASE_URL` dans `.env`.

## Application

- **Webhook** : `POST /api/flexpay/callback` (URL publique **HTTPS** en production).
- Variables : `backend/.env.example` (`FLEXPAY_*`).

Référence ouverte sur le contrat HTTP : [devscast/flexpay-ts](https://github.com/devscast/flexpay-ts).
