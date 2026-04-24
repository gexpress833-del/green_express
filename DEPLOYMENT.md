# 🚀 Green Express - Guide de Déploiement

## Prérequis

- PHP 8.1+
- Node.js 18+
- PostgreSQL 13+ (production)
- Cloudinary account
- Domain & SSL certificate

## Architecture

```
┌─────────────────────────────────────┐
│        Frontend (Next.js)            │
│   http://localhost:3000             │
└──────────────┬──────────────────────┘
               │ API Calls
               ↓
┌─────────────────────────────────────┐
│      Backend (Laravel 10)            │
│   http://127.0.0.1:8000             │
└──────────────┬──────────────────────┘
               │ DB Queries
               ↓
┌─────────────────────────────────────┐
│        SQLite / PostgreSQL          │
│   ./database/database.sqlite        │
└─────────────────────────────────────┘

Cloudinary (Image Storage)
├── green-express/menus/
├── green-express/promotions/
└── green-express/uploads/
```

## Déploiement Local (Développement)

### 1. Setup Backend

```bash
cd C:\SERVICE\backend

# Installer dépendances
composer install

# Configuration
cp .env.example .env
php artisan key:generate
php artisan jwt:secret

# Base de données (développement uniquement : efface toutes les tables)
php artisan migrate:fresh --seed

# Démarrer serveur
php artisan serve
# Server run on http://127.0.0.1:8000
```

### 2. Setup Frontend

```bash
cd C:\SERVICE\frontend-next

# Installer dépendances
npm install

# Variables d'environnement
cp .env.local.example .env.local
# Ajouter: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Démarrer dev server
npm run dev
# App run on http://localhost:3000
```

### 3. Vérifier Montage

```bash
# Test API
curl http://127.0.0.1:8000/api/promotions

# Test Frontend (login)
# Visiter http://localhost:3000/login
# Entrer: admin@test.com / password
```

## Déploiement à Vercel (Frontend)

### Prérequis
- Compte Vercel
- Repository GitHub

### Steps

1. **Push code vers GitHub**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Connecter à Vercel**
   - Aller sur https://vercel.com
   - Cliquer "New Project"
   - Import repository GitHub
   - Sélectionner `frontend-next` folder

3. **Variables d'environnement**
   ```
   NEXT_PUBLIC_API_URL=https://api.greenexpress.com/api
   ```

4. **Déployer**
   - Vercel détecte Next.js automatiquement
   - Clique "Deploy"
   - Attendre ~3-5 min

### Après Déploiement
- Domaine auto-généré: `https://green-express-xyz.vercel.app`
- Ou custom domain: Settings → Domains

## Déploiement à Heroku (Backend)

### Prérequis
- Compte Heroku
- Heroku CLI installé
- Repository GitHub

### Steps

1. **Créer app Heroku**
   ```bash
   heroku create green-express-api
   heroku addons:create heroku-postgresql:hobby-dev -a green-express-api
   ```

2. **Configuration variables**
   ```bash
   heroku config:set APP_NAME="Green Express" -a green-express-api
   heroku config:set APP_ENV=production -a green-express-api
   heroku config:set APP_DEBUG=false -a green-express-api
   heroku config:set APP_KEY="base64:xxxxx" -a green-express-api
   heroku config:set JWT_SECRET="xxxxx" -a green-express-api
   heroku config:set CLOUDINARY_CLOUD_NAME="xxxxx" -a green-express-api
   heroku config:set CLOUDINARY_API_KEY="xxxxx" -a green-express-api
   heroku config:set CLOUDINARY_API_SECRET="xxxxx" -a green-express-api
   ```

3. **Déployer**
   ```bash
   git subtree push --prefix backend heroku main
   # ou
   heroku deploy:git -a green-express-api
   ```

4. **Migrations** (ne jamais utiliser `migrate:fresh` en production : cela supprime toutes les données)
   ```bash
   heroku run php artisan migrate --force -a green-express-api
   ```
   Données de référence (plans, menus, comptes de démo) : exécuter un seeder dédié si besoin, pas un reset de base.

### Après Déploiement
- API disponible sur: `https://green-express-api.herokuapp.com/api`

## Perte de données en production (causes fréquentes)

- **`migrate:fresh` ou `db:wipe`** : suppriment toutes les tables et les données. À réserver au développement local uniquement.
- **Nouvelle instance PostgreSQL** ou **`DATABASE_URL` changée** : l’application se connecte à une base vide (migrations seules ne recréent pas les utilisateurs réels).
- **Mauvaise base** : variables d’environnement pointant vers staging ou une autre région.

**Reconstituer le catalogue** (plans d’abonnement, menus de démo, comptes `*@test.com`, permissions) : `php artisan migrate --force` puis `php artisan db:seed --class=RenderProductionSeeder --force` sur le serveur (ou `composer seed-render` en local avec `.env` pointant vers la bonne base). Les **comptes clients réels** ne sont récupérables que via une **sauvegarde** hébergeur (ex. backups Render).

## Environment Variables Checklist

### Backend (.env)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY=base64:xxxxx`
- [ ] `DB_CONNECTION=pgsql` (production)
- [ ] `DB_HOST=xxxxx`
- [ ] `DB_PORT=5432`
- [ ] `DB_DATABASE=greenexpress`
- [ ] `DB_USERNAME=xxxxx`
- [ ] `DB_PASSWORD=xxxxx`
- [ ] `JWT_SECRET=xxxxx`
- [ ] `CLOUDINARY_*` credentials
- [ ] `SANCTUM_STATEFUL_DOMAINS=app.greenexpress.com`
- [ ] `LOG_CHANNEL=stack` (ou Sentry)

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_URL=https://api.greenexpress.com/api`

## Processus CI/CD

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: cd backend && composer install && php artisan test
      - run: cd frontend-next && npm ci && npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: git subtree push --prefix backend heroku main
      - run: npm run vercel --prod
```

## Monitoring & Logs

### Backend Logs
```bash
# Local
tail -f storage/logs/laravel.log

# Heroku
heroku logs --tail -a green-express-api

# Sentry (optional)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Frontend Logs
- Vercel Dashboard → Monitoring → Logs
- Browser DevTools Console

## Backup & Maintenance

### Database Backup
```bash
# Local
cp database/database.sqlite database/database.sqlite.backup

# Heroku
heroku pg:backups:capture -a green-express-api
heroku pg:backups:download -a green-express-api
```

### Migrations
```bash
# Production
heroku run php artisan migrate -a green-express-api

# Rollback if needed
heroku run php artisan migrate:rollback -a green-express-api
```

## Troubleshooting

### Frontend won't load
- [ ] Check NEXT_PUBLIC_API_URL in .env.local
- [ ] Check CORS settings in backend
- [ ] Check browser console for errors

### API 500 Errors
- [ ] Check backend logs: `heroku logs --tail`
- [ ] Check JWT_SECRET is set correctly
- [ ] Check database connection

### Images not uploaded
- [ ] Check Cloudinary credentials
- [ ] Check upload folder permissions
- [ ] Check file size < 5MB

## Post-Deployment Checklist

- [ ] Landing page loads
- [ ] Login works (admin@test.com)
- [ ] Dashboard visible
- [ ] Create menu/promotion
- [ ] Upload image works
- [ ] Claim promotion works
- [ ] Logout works
- [ ] Rate limiting active
- [ ] SSL/HTTPS working
- [ ] Logs being recorded

---

**Deployment Date:** 18 February 2026  
**Deployer:** DevTeam  
**Contact:** devops@greenexpress.com
