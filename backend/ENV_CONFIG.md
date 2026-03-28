# Configuration backend (.env)

Ce fichier sert uniquement de **référence de variables**.  
Il ne doit contenir **aucun secret réel**.

La source de vérité versionnée pour la configuration locale/projet est :

- `backend/.env.example`

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

### pawaPay
- `PAYMENT_WEBHOOK_SECRET`
- `PAWAPAY_API_TOKEN`
- `PAWAPAY_BASE_URL`
- `PAWAPAY_CALLBACK_URL`
- `PAWAPAY_TIMEOUT`
- `PAWAPAY_PROVIDER_COD_VODACOM`
- `PAWAPAY_PROVIDER_COD_AIRTEL`
- `PAWAPAY_PROVIDER_COD_ORANGE`
- `PAWAPAY_PROVIDER_KEN_DEFAULT`
- `PAWAPAY_PROVIDER_KEN_AIRTEL`
- `PAWAPAY_PROVIDER_UGA_DEFAULT`
- `PAWAPAY_PROVIDER_UGA_AIRTEL`

## Bonnes pratiques

- Ne jamais committer de vraie clé `APP_KEY`, token pawaPay, mot de passe DB ou secret Cloudinary
- Après exposition accidentelle d’une clé, faire une **rotation**
- Pour créer un `.env` local :

```bash
cd C:\SERVICE\backend
copy .env.example .env
```
