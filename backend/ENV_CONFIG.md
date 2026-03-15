# Configuration .env Backend

## Instructions

Copiez le contenu ci-dessous dans votre fichier `backend/.env` :

```env
APP_NAME="Green Express"
APP_ENV=local
APP_KEY=base64:kAEt9ZjPRWk0gpsS6kR6mI5cUE9E2qxA/aIplWKVFHU=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

APP_LOCALE=fr
APP_FALLBACK_LOCALE=fr
APP_FAKER_LOCALE=fr_FR

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Base de données SQLite (rapide pour dev local)
DB_CONNECTION=sqlite

# JWT Authentication
JWT_SECRET=VotreCleSecreteSuperSecurePourJWTTokens2026
JWT_ALGO=HS256
JWT_TTL=1440
JWT_REFRESH_TTL=20160

# Sanctum (pour CORS Next.js ↔ Laravel)
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=localhost

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:3000

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@greenexpress.local"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

# Cloudinary (upload images menus)
CLOUDINARY_URL=
CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payment Provider (Shwary ou autre)
PAYMENT_WEBHOOK_SECRET=your-payment-webhook-secret-change-in-production

# Shwary Mobile Money Payment Gateway (Production)
SHWARY_MERCHANT_ID=f542c49b-1f9a-4686-a01e-1722722dbcf1
SHWARY_MERCHANT_KEY=shwary_eebd1b76-de0b-42f4-86b1-a1c47255d4e7
SHWARY_BASE_URL=https://api.shwary.com/api/v1
SHWARY_SANDBOX=false
SHWARY_WALLET_ADDRESS=0xa5dDeaea1f681Bacda95D4d96f5243C19E5D1b18

VITE_APP_NAME="${APP_NAME}"
```

## Variables importantes ajoutées

### JWT Authentication
- `JWT_SECRET` : Clé secrète pour signer les tokens JWT
- `JWT_TTL` : Durée de vie du token (1440 min = 24h)
- `JWT_REFRESH_TTL` : Durée validité refresh token (20160 min = 14 jours)

### CORS & Sanctum
- `SANCTUM_STATEFUL_DOMAINS` : Domaines Next.js autorisés
- `FRONTEND_URL` : URL frontend pour CORS
- `SESSION_DOMAIN` : localhost pour partage cookies

### Base de données
- Par défaut : **SQLite** (fichier `database/database.sqlite`)
- Pour MySQL : décommentez les lignes DB_HOST, DB_PORT, etc.

## Commandes rapides

```bash
# Copier et éditer le .env
cd C:\SERVICE\backend
copy .env.example .env
notepad .env

# OU utiliser ce fichier comme référence
```
