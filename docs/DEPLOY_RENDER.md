# Déploiement Green Express (Render + Vercel)

Ce guide décrit la configuration actuelle de l’application avec :

- **Backend Laravel** sur [Render](https://render.com)
- **Frontend Next.js** sur [Vercel](https://vercel.com)
- **Paiements Mobile Money** via **FlexPay / FlexPaie**

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

#### FlexPay / FlexPaie (production)
- `FLEXPAY_MERCHANT` — code marchand (FlexPaie)
- `FLEXPAY_TOKEN` — jeton JWT (secret ; coller dans Render **Environment**)
- `FLEXPAY_ENV=prod` — API prod + vérification sur `apicheck.flexpaie.com`
- `FLEXPAY_MOCK=false`
- `FLEXPAY_CALLBACK_URL=https://TON-BACKEND.onrender.com/api/flexpay/callback` (HTTPS Render)
- `FLEXPAY_TIMEOUT=30`
- optionnel : `FLEXPAY_WEBHOOK_SECRET` ou `PAYMENT_WEBHOOK_SECRET`
- détails et URLs : `backend/docs/FLEXPAY.md`

### Après déploiement backend

Lancer une fois :

```bash
php artisan migrate --force
```

Configurer côté **FlexPaie / marchand** l’URL de callback IPN (si le tableau de bord le demande) :

```text
https://TON-BACKEND.onrender.com/api/flexpay/callback
```

Même valeur que `FLEXPAY_CALLBACK_URL` (HTTPS Render).

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

Le job `CheckPendingPaymentsJob` sert de **fallback** si le webhook FlexPay n’arrive pas.

- Il est planifié dans `backend/app/Console/Kernel.php`
- Il est exécuté **chaque minute**
- Le scheduler est prévu pour tourner via un **Cron Job Render**

Voir le guide dédié : `docs/CRON_EXTERNE.md`

---

## 4. Vérifications manuelles après mise en ligne

1. Ouvrir le frontend et passer une commande
2. Lancer `POST /api/orders/{id}/initiate-payment`
3. Vérifier que FlexPay appelle :
   - `POST /api/flexpay/callback`
4. Vérifier en base :
   - `payments.provider = flexpay`
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
- toute clé FlexPay, Cloudinary, `APP_KEY`, secrets de session ou base

---

## 6. Notes

- Render et Vercel fournissent le HTTPS nécessaire pour les cookies cross-domain et les callbacks FlexPay
- Après exposition accidentelle d’un token FlexPay, demander une **rotation** à FlexPaie / Infoset
