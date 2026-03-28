# Déploiement Green Express (Render + Vercel)

Ce guide décrit la configuration actuelle de l’application avec :

- **Backend Laravel** sur [Render](https://render.com)
- **Frontend Next.js** sur [Vercel](https://vercel.com)
- **Paiements Mobile Money** via **pawaPay**

---

## 1. Backend Laravel sur Render

Le backend est prévu pour être déployé via **Docker** avec le `Dockerfile` situé dans `backend/`.

### Création du Web Service

1. Render → **New** → **Web Service**
2. Choisir le dépôt GitHub
3. Configurer :
   - **Root Directory** : `backend`
   - **Environment** : `Docker`
   - **Name** : par exemple `green-express-api`

### Variables Render à définir

#### Application
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<sortie de php artisan key:generate --show>`
- `APP_URL=https://TON-BACKEND.onrender.com`

#### Base de données
- `DB_CONNECTION=pgsql` ou `mysql`
- soit `DB_URL=<url interne Render>`
- soit `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

#### Sessions / SPA
- `SESSION_DRIVER=database`
- `SESSION_SAME_SITE=none`
- `SESSION_SECURE_COOKIE=true`
- `CACHE_STORE=database`
- `SANCTUM_STATEFUL_DOMAINS=ton-projet.vercel.app`
- `CORS_ALLOWED_ORIGINS=https://ton-projet.vercel.app`
- `FRONTEND_URL=https://ton-projet.vercel.app`

#### Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### pawaPay
- `PAWAPAY_API_TOKEN`
- `PAWAPAY_BASE_URL=https://api.sandbox.pawapay.io`
- en production : `PAWAPAY_BASE_URL=https://api.pawapay.io`
- `PAWAPAY_CALLBACK_URL=https://TON-BACKEND.onrender.com/api/pawapay/callback`
- `PAWAPAY_TIMEOUT=30`
- optionnel : `PAWAPAY_WEBHOOK_SECRET`

#### Providers Mobile Money
- `PAWAPAY_PROVIDER_COD_VODACOM=VODACOM_MPESA_COD`
- `PAWAPAY_PROVIDER_COD_AIRTEL=AIRTEL_OAPI_COD`
- `PAWAPAY_PROVIDER_COD_ORANGE=ORANGE_OAPI_COD`
- `PAWAPAY_PROVIDER_KEN_DEFAULT=SAFARICOM_MPESA_KEN`
- `PAWAPAY_PROVIDER_KEN_AIRTEL=AIRTEL_OAPI_KEN`
- `PAWAPAY_PROVIDER_UGA_DEFAULT=MTN_MOMO_UGA`
- `PAWAPAY_PROVIDER_UGA_AIRTEL=AIRTEL_OAPI_UGA`

### Après déploiement backend

Lancer une fois :

```bash
php artisan migrate --force
```

Configurer ensuite dans le dashboard pawaPay :

```text
Deposits callback URL = https://TON-BACKEND.onrender.com/api/pawapay/callback
```

---

## 2. Frontend Next.js sur Vercel

### Création du projet

1. Vercel → **Add New** → **Project**
2. Importer le dépôt GitHub
3. Définir :
   - **Root Directory** : `frontend-next`
   - **Framework Preset** : `Next.js`

### Variable d’environnement frontend

- `NEXT_PUBLIC_API_URL=https://TON-BACKEND.onrender.com`

Le frontend utilise ensuite les endpoints `/api/...` du backend avec `credentials: 'include'`.

---

## 3. Scheduler / relance paiements

Le job `CheckPendingPaymentsJob` sert de **fallback** si le webhook pawaPay n’arrive pas.

- Il est planifié dans `backend/app/Console/Kernel.php`
- Il est exécuté **chaque minute**
- Le scheduler est prévu pour tourner via un **Cron Job Render**

Voir le guide dédié : `docs/CRON_EXTERNE.md`

---

## 4. Vérifications manuelles après mise en ligne

1. Ouvrir le frontend et passer une commande
2. Lancer `POST /api/orders/{id}/initiate-payment`
3. Vérifier que pawaPay appelle :
   - `POST /api/pawapay/callback`
4. Vérifier en base :
   - `payments.provider = pawapay`
   - `payments.status = completed` après callback ou fallback
   - `orders.status = paid`
   - `orders.delivery_code` rempli

Pour les abonnements :

1. Créer une demande d’abonnement
2. Lancer `POST /api/subscriptions/{id}/initiate-payment`
3. Vérifier que le paiement passe en `completed`
4. L’activation d’abonnement reste ensuite pilotée par l’admin si votre process métier le prévoit

---

## 5. Fichiers sensibles

Ne jamais versionner :

- `backend/.env`
- `frontend-next/.env.local`
- toute clé pawaPay, Cloudinary, `APP_KEY`, secrets de session ou base

---

## 6. Notes

- Render et Vercel fournissent le HTTPS nécessaire pour les cookies cross-domain et les callbacks pawaPay
- Si tu as déjà utilisé un ancien provider de paiement, considère les anciennes notes de migration comme **obsolètes**
- Après exposition accidentelle d’un token pawaPay, il faut **le régénérer** dans le dashboard
