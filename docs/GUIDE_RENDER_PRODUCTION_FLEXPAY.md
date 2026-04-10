# Guide production Render + Vercel — Green Express (FlexPay)

Ce document reprend ta configuration **réelle** (URLs Render / Vercel) et la **synchronise** avec FlexPay à la place de Shwary.  
**Ne commite jamais** ce fichier s’y trouvent des secrets ; les valeurs sensibles restent uniquement dans **Render → Environment**.

---

## URLs de référence

| Rôle | URL |
|------|-----|
| Backend (API Laravel) | `https://green-express-rdc.onrender.com` |
| Frontend (Next.js) | `https://green-express-iota.vercel.app` |
| Callback FlexPay (IPN) | `https://green-express-rdc.onrender.com/api/flexpay/callback` |

---

## Bloc variables — à coller / aligner sur Render

Ci-dessous : mêmes familles que ton ancien `.env` Shwary, avec **FlexPay** et les **vraies URLs** ci-dessus.  
Les lignes **secrètes** (base, Cloudinary, `APP_KEY`, `FLEXPAY_TOKEN`, etc.) : garde celles **déjà saisies sur Render** ou génère-en de nouvelles ; **ne les recopie pas dans Git**.

```env
# --- Application ---
APP_NAME="Green Express"
APP_ENV=production
APP_DEBUG=false
APP_KEY=<déjà défini sur Render — base64:…>
APP_URL=https://green-express-rdc.onrender.com
APP_LOCALE=fr
APP_FALLBACK_LOCALE=fr
APP_FAKER_LOCALE=fr_FR
APP_MAINTENANCE_DRIVER=file

# Recommandation prod : APP_DEBUG=false (évite fuite d’infos en cas d’erreur).
# Si tu avais APP_DEBUG=true volontairement pour diagnostiquer, repasse à false une fois le debug terminé.

# --- Base / cache / files ---
BCRYPT_ROUNDS=12
BROADCAST_CONNECTION=log
CACHE_STORE=database
DB_CONNECTION=pgsql
DB_URL=<secret PostgreSQL Render — inchangé si même base>
FILESYSTEM_DISK=local
LOG_CHANNEL=stack
LOG_LEVEL=warning
QUEUE_CONNECTION=database

# --- Sessions (SPA Vercel + cookies) ---
SESSION_DRIVER=database
SESSION_CONNECTION=pgsql
SESSION_ENCRYPT=false
SESSION_LIFETIME=120
SESSION_PATH=/
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true

# --- CORS / Sanctum (front Vercel) ---
FRONTEND_URL=https://green-express-iota.vercel.app
SANCTUM_STATEFUL_DOMAINS=green-express-iota.vercel.app
CORS_ALLOWED_ORIGINS=https://green-express-iota.vercel.app

# --- Mail (tel que sur ton Render) ---
MAIL_MAILER=log
MAIL_FROM_ADDRESS=hello@greenexpress.com
MAIL_FROM_NAME="${APP_NAME}"

# --- Cloudinary (secrets inchangés côté Render) ---
CLOUDINARY_CLOUD_NAME=<inchangé>
CLOUDINARY_API_KEY=<inchangé>
CLOUDINARY_API_SECRET=<inchangé>

# --- FlexPay / FlexPaie (remplace tout bloc SHWARY_*) ---
FLEXPAY_MERCHANT=<code marchand FlexPaie — ex. DM_CHIC>
FLEXPAY_TOKEN=<jeton JWT fourni par FlexPaie — ne pas versionner>
FLEXPAY_ENV=prod
FLEXPAY_MOCK=false
FLEXPAY_CALLBACK_URL=https://green-express-rdc.onrender.com/api/flexpay/callback
FLEXPAY_TIMEOUT=30
# Optionnel :
# FLEXPAY_WEBHOOK_SECRET=...
# FLEXPAY_RATE_USD_TO_CDF=2500
# FLEXPAY_MIN_AMOUNT_CDF=2900

# --- À supprimer de Render (obsolète après migration FlexPay) ---
# SHWARY_*
# PAWAPAY_* (si encore présent)

VITE_APP_NAME="${APP_NAME}"
```

---

## Étapes sur Render (résumé)

1. **Dashboard** → service `green-express-rdc` (ou nom équivalent) → **Environment**.
2. **Supprimer** toutes les variables `SHWARY_*` (et `PAWAPAY_*` si présentes).
3. **Ajouter** `FLEXPAY_MERCHANT`, `FLEXPAY_TOKEN`, `FLEXPAY_ENV=prod`, `FLEXPAY_MOCK=false`, `FLEXPAY_CALLBACK_URL` comme ci-dessus.
4. Vérifier `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `CORS_ALLOWED_ORIGINS` (sans slash final pour le domaine Vercel, comme dans ton extrait).
5. Mettre **`APP_DEBUG=false`** en production sauf diagnostic temporaire.
6. **Sauvegarder** → déclencher un **redéploiement** du service.
7. **Shell** Render (si besoin) : `php artisan migrate --force` puis `php artisan config:cache`.

---

## Côté FlexPaie (marchand)

- URL de callback / IPN (si demandée dans le dashboard) :  
  `https://green-express-rdc.onrender.com/api/flexpay/callback`  
- Identique à `FLEXPAY_CALLBACK_URL`.

---

## Vercel (frontend)

- `NEXT_PUBLIC_API_URL=https://green-express-rdc.onrender.com`  
- Redéployer après toute modification.

---

## Sécurité

Tu as partagé dans un message des **secrets** (clé d’app, base, Cloudinary, clés Shwary). Même si ce guide ne les répète pas :  
**fais tourner les credentials exposés** (Cloudinary, DB si crainte, anciennes clés Shwary, jeton FlexPay si copié en clair ailleurs).

---

## Fichiers du dépôt

- Détail FlexPay : `backend/docs/FLEXPAY.md`
- Déploiement général : `docs/DEPLOY_RENDER.md`
