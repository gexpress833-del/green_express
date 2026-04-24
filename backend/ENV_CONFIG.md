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

**Perte soudaine des données (utilisateurs, menus, plans)** : en production, vérifier que personne n’a lancé `php artisan migrate:fresh` ou `db:wipe` (cela détruit tout). Vérifier aussi que `DATABASE_URL` / `DB_URL` pointe toujours vers **la même** instance Postgres (une nouvelle base Render ou une URL copiée par erreur = base vide). Référence données catalogue : `composer seed-render` ou `db:seed --class=RenderProductionSeeder` après `migrate --force`. Les comptes clients historiques ne reviennent que via **sauvegarde** (ex. Render → backups).

**Contrôle rapide** : `php artisan gx:production-health` — affiche la connexion DB active (URL avec mot de passe masqué), `APP_URL`, et le nombre de lignes (users, menus, plans, etc.).

### Restauration PostgreSQL (données historiques)

Sans **fichier de sauvegarde** (`.sql` ou dump `pg_dump` custom), aucune restauration des anciens comptes / commandes n’est possible : l’application ne peut pas « reconstruire » des données jamais exportées.

1. **Obtenir un dump**  
   - **Render** : Dashboard → votre base Postgres → onglet **Backups** (selon le plan ; les offres gratuites n’ont souvent pas d’historique long). Téléchargez un point de restauration si disponible.  
   - **Copie locale** : si vous aviez exporté avant la perte, utilisez ce fichier.  
   - **À l’avenir** : `cd backend` puis `.\scripts\export-postgres-dump.ps1` (nécessite `pg_dump` dans le PATH) → fichier sous `backend/backups/` (dossier ignoré par Git).

2. **Restaurer** (nécessite `psql` pour `.sql`, ou `pg_restore` pour un dump custom) :  
   `.\scripts\restore-postgres-from-dump.ps1 -DumpPath "C:\chemin\vers\fichier.sql"`  
   Le script lit `DATABASE_URL` / `DB_URL` dans `.env.production` par défaut. **Cela peut écraser** la base actuelle : exporter l’état présent avant si besoin.

3. Après restauration : `php artisan migrate --force` si le schéma a divergé, puis `php artisan gx:production-health`.

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
