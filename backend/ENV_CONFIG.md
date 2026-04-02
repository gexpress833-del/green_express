# Configuration backend (.env)

Ce fichier sert uniquement de **référence de variables**.  
Il ne doit contenir **aucun secret réel**.

La source de vérité versionnée pour la configuration locale/projet est :

- `backend/.env.example`

### Développement local avec **MySQL**

En local, le projet est prévu pour une base **MySQL** (`DB_CONNECTION=mysql`, `DB_HOST`, `DB_DATABASE`, etc.). Créer la base `green_express` (utf8mb4), puis `php artisan migrate`.

### Sauvegarde production (`.env.production`)

Sur ta machine uniquement, tu peux conserver une copie **`backend/.env.production`** avec les variables Render / PostgreSQL / secrets (fichier **ignoré par Git** — voir `.gitignore`). Elle sert à recopier les clés dans le dashboard hébergé ou à restaurer un poste ; **ne pas** la committer.

## Variables importantes

### Application
- `APP_ENV`
- `APP_DEBUG`
- `APP_KEY`
- `APP_URL`

### Base de données
- `DB_CONNECTION`
- `DB_URL` ou `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD`

### Sessions / frontend
- `SESSION_DRIVER`
- `SESSION_SAME_SITE`
- `SESSION_SECURE_COOKIE`
- `SANCTUM_STATEFUL_DOMAINS`
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`

### Cloudinary (images menus, promos, profils, abonnements)
- Soit **`CLOUDINARY_URL`** = `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (recommandé, copie depuis le dashboard Cloudinary)
- Soit les trois variables : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Vérification : `GET /api/upload/config` (utilisateur connecté)

### FlexPay / FlexPaie (Mobile Money — RDC, Infoset)
- `FLEXPAY_MERCHANT` — code marchand
- `FLEXPAY_TOKEN` — JWT Bearer (secret ; ne pas versionner)
- `FLEXPAY_ENV` — `dev` (beta-backend) ou `prod` (backend + **apicheck** pour la vérification)
- `FLEXPAY_CALLBACK_URL` — URL publique HTTPS : `POST /api/flexpay/callback`
- `FLEXPAY_MOCK` — `true` en local pour simuler sans appeler l’API
- `FLEXPAY_PAYMENT_BASE_URL` — optionnel ; défaut prod : `https://backend.flexpay.cd/api/rest/v1` (`…/paymentService`)
- `FLEXPAY_CHECK_BASE_URL` — optionnel ; défaut prod : `https://apicheck.flexpaie.com/api/rest/v1` (`…/check/{orderNumber}`)
- `FLEXPAY_CARD_PAYMENT_URL` — référence carte : `https://cardpayment.flexpay.cd/v1.1/pay` (hors flux Laravel actuel)
- `FLEXPAY_WEBHOOK_SECRET` ou `PAYMENT_WEBHOOK_SECRET` — optionnel
- `FLEXPAY_RATE_USD_TO_CDF`, `FLEXPAY_MIN_AMOUNT_CDF`

## Bonnes pratiques

- Ne jamais committer de vraie clé `APP_KEY`, token FlexPay, mot de passe DB ou secret Cloudinary
- Après exposition accidentelle d’une clé, faire une **rotation**
- Pour créer un `.env` local :

```bash
cd C:\SERVICE\backend
copy .env.example .env
```
