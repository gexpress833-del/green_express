# Configuration Shwary en production

Ce document décrit comment activer les paiements Shwary (Mobile Money RDC, Kenya, Ouganda) en **production**.

## Référence SDK

Le projet utilise le **SDK PHP officiel Shwary** (`shwary/php-sdk`). Documentation : méthodes d’init (variables d’environnement, tableau, manuelle), `payDRC` / Kenya / Ouganda, webhooks, mode sandbox, gestion des erreurs.

**Correspondance avec notre intégration Laravel :**

| SDK (doc officielle) | Notre projet |
|----------------------|--------------|
| `SHWARY_MERCHANT_ID`, `SHWARY_MERCHANT_KEY` | Idem dans `.env` et `config/shwary.php` |
| `SHWARY_SANDBOX` (true = test, false = prod) | Idem ; en production défaut = false |
| `SHWARY_TIMEOUT` (optionnel, défaut 30) | Idem |
| Init : `Shwary::initFromArray()` ou env | `ShwaryClient::fromArray()` alimenté par `config('shwary')` |
| Paiement RDC : montant en CDF, téléphone `+243...` | `ShwaryService::convertToLocalAmount()` (min 2901 CDF), `normalizePhoneNumber()` |
| Callback webhook (URL HTTPS) | `SHWARY_CALLBACK_URL` → `POST /api/shwary/callback` |

**RDC (doc SDK) :** montant minimum **2901 CDF**, numéro au format **+243** — déjà respecté dans `ShwaryService::getSupportedCountries()` et la validation téléphone.

## 1. Obtenir les identifiants production Shwary

- Connectez-vous à votre **tableau de bord Shwary** (compte marchand).
- Passez de l’environnement **Sandbox / Test** à **Production** (ou demandez l’activation production à Shwary).
- Récupérez :
  - **Merchant ID** (ex. `shwary_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
  - **Merchant Key** (clé secrète)
- Si Shwary fournit un **secret pour les webhooks**, notez-le pour la vérification de signature.

## 2. Variables d’environnement (.env) en production

Dans le fichier `.env` de votre serveur de production, définir :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.com

# Shwary — PRODUCTION
SHWARY_MERCHANT_ID=votre_merchant_id_production
SHWARY_MERCHANT_KEY=votre_merchant_key_production
SHWARY_BASE_URL=https://api.shwary.com
SHWARY_SANDBOX=false
SHWARY_MOCK=false

# Obligatoire en production : URL HTTPS du callback (Shwary n'accepte que HTTPS)
SHWARY_CALLBACK_URL=https://votre-domaine.com/api/shwary/callback

# Recommandé : secret pour vérifier la signature des webhooks (si Shwary le fournit)
SHWARY_WEBHOOK_SECRET=votre_webhook_secret

# Taux de conversion (ajuster selon les cours réels si besoin)
SHWARY_RATE_USD_TO_CDF=2500
SHWARY_RATE_USD_TO_KES=130
SHWARY_RATE_USD_TO_UGX=3800
SHWARY_DEFAULT_ORDER_CURRENCY=USD
```

### Récapitulatif

| Variable | Production | Description |
|----------|------------|-------------|
| `SHWARY_SANDBOX` | **false** | Utiliser l’API production Shwary. |
| `SHWARY_MOCK` | **false** | Appeler réellement l’API (pas de simulation). |
| `SHWARY_CALLBACK_URL` | **https://...** | URL publique HTTPS du webhook (obligatoire). |
| `SHWARY_WEBHOOK_SECRET` | (recommandé) | Secret pour vérifier `X-Webhook-Signature`. |

## 3. URL de callback webhook

- **Route exposée** : `POST /api/shwary/callback`
- **URL complète** : `https://votre-domaine.com/api/shwary/callback`
- Cette URL doit être **HTTPS** et **accessible depuis Internet** (pas de localhost).
- À configurer côté Shwary (dashboard) si Shwary demande d’enregistrer l’URL de callback.

## 4. Vérifications avant mise en production

- [ ] `APP_ENV=production` et `APP_DEBUG=false`
- [ ] `SHWARY_MERCHANT_ID` et `SHWARY_MERCHANT_KEY` = identifiants **production**
- [ ] `SHWARY_SANDBOX=false` et `SHWARY_MOCK=false`
- [ ] `SHWARY_CALLBACK_URL` = URL HTTPS réelle du site (ex. `https://api.votresite.com/api/shwary/callback` si l’API est sur un sous-domaine)
- [ ] Certificat SSL valide sur le domaine (HTTPS)
- [ ] `SHWARY_WEBHOOK_SECRET` défini si Shwary fournit un secret pour les webhooks

## 5. CORS et domaine frontend

Si le frontend est sur un autre domaine (ex. `https://app.votresite.com`) :

- Dans `.env` : `SANCTUM_STATEFUL_DOMAINS=app.votresite.com` et `CORS_ALLOWED_ORIGINS=https://app.votresite.com`
- Les cookies de session et les requêtes vers l’API doivent être autorisés (credentials, CORS, SameSite selon votre setup).

## 6. Tester après déploiement

1. Créer une commande de test depuis le frontend (montant faible).
2. Initier un paiement Shwary (saisie du numéro Mobile Money).
3. Vérifier dans les logs Laravel (`storage/logs/laravel.log`) : `Shwary payment initiated`, puis après paiement côté client : `Shwary Callback Received` et `Shwary Payment Completed - Order Updated`.
4. Vérifier que la commande passe en « En attente de livraison » et qu’un code de livraison est généré.

En cas d’erreur 401/403 : vérifier les identifiants et que le compte Shwary est bien en mode production. En cas de callback non reçu : vérifier que l’URL est accessible en HTTPS et que le firewall n’ bloque pas les requêtes entrantes vers `/api/shwary/callback`.
