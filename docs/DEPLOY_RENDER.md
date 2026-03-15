# Déploiement Green Express (GitHub + Render + Vercel)

Ce guide décrit comment déployer **le backend Laravel sur Render** et **le frontend Next.js sur Vercel** à partir d’un dépôt GitHub.

- **Backend (API)** → [Render](https://render.com) (Web Service PHP)
- **Frontend (Next.js)** → [Vercel](https://vercel.com)

---

## 1. Pousser le code sur GitHub

### 1.1 Initialiser Git et premier commit (si pas déjà fait)

```bash
cd c:\SERVICE
git init
git add .
git status   # Vérifier que .env et node_modules ne sont pas listés
git commit -m "Initial commit: Green Express backend Laravel + frontend Next.js"
```

### 1.2 Créer le dépôt sur GitHub

1. Va sur [github.com](https://github.com) → **New repository**.
2. Nom suggéré : `green-express` (ou `SERVICE`).
3. Ne coche **pas** "Add a README" si tu as déjà fait `git init` et un commit.
4. Crée le dépôt.

### 1.3 Branche par défaut et push

```bash
git branch -M main
git remote add origin https://github.com/TON_USERNAME/green-express.git
git push -u origin main
```

Remplace `TON_USERNAME` et `green-express` par ton compte GitHub et le nom du dépôt.

---

## 2. Backend Laravel sur Render (Web Service)

### 2.1 Créer le service

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connecte ton compte GitHub et choisis le dépôt (ex. `green-express`).
3. Configuration :
   - **Name** : `green-express-api` (ou au choix).
   - **Root Directory** : `backend`.
   - **Environment** : `PHP`.
   - **Region** : celle la plus proche de tes utilisateurs.

### 2.2 Build & Start

- **Build Command** :
  ```bash
  composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache
  ```
- **Start Command** :
  ```bash
  php artisan serve --host=0.0.0.0 --port=$PORT
  ```
  (Render fournit la variable `PORT`.)

### 2.3 Variables d’environnement (Backend sur Render)

À définir dans **Environment** du service Render. Ne pas committer le fichier `.env` (déjà dans `.gitignore`).

| Variable | Exemple / Note |
|----------|-----------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | Générer avec `php artisan key:generate --show` (une fois en local) |
| `APP_URL` | `https://green-express-api.onrender.com` (URL du service Render une fois créé) |
| `DB_CONNECTION` | `mysql` ou `pgsql` |
| `DB_HOST` | Host fourni par Render (PostgreSQL) ou autre (MySQL externe) |
| `DB_PORT` | 5432 (PostgreSQL) ou 3306 (MySQL) |
| `DB_DATABASE` | Nom de la base |
| `DB_USERNAME` | Utilisateur base |
| `DB_PASSWORD` | Mot de passe base |
| `SESSION_DRIVER` | `database` (avec table `sessions`) |
| `SESSION_CONNECTION` | `pgsql` ou `mysql` selon ta BDD |
| `SESSION_SAME_SITE` | **`none`** (obligatoire quand front et API sont sur des domaines différents, ex. Vercel vs Render) |
| `SESSION_SECURE_COOKIE` | **`true`** (obligatoire avec SameSite=none ; Render est en HTTPS) |
| `CACHE_STORE` | `database` ou `redis` |
| **Frontend = Vercel** : utiliser l’URL Vercel du frontend ci-dessous. |
| `SANCTUM_STATEFUL_DOMAINS` | Domaine du frontend Vercel, ex. `green-express.vercel.app` (sans `https://`) |
| `CORS_ALLOWED_ORIGINS` | `https://green-express.vercel.app` (URL du frontend sur Vercel) |
| `FRONTEND_URL` | `https://green-express.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Ton cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary |
| `SHWARY_MERCHANT_ID` | ID marchand Shwary |
| `SHWARY_MERCHANT_KEY` | Clé marchande Shwary |
| `SHWARY_MOCK` | `false` en production |
| `SHWARY_SANDBOX` | `false` pour vrais paiements |
| `SHWARY_CALLBACK_URL` | **À définir uniquement après déploiement** : `https://green-express-api.onrender.com/api/shwary/callback` (voir encadré ci-dessous) |
| `SHWARY_WEBHOOK_SECRET` ou `PAYMENT_WEBHOOK_SECRET` | Optionnel : uniquement si Shwary propose une config webhook (URL + clé secrète) |

**Quand définir `SHWARY_CALLBACK_URL` ?**  
Shwary doit pouvoir appeler ton API en HTTPS pour confirmer les paiements. En **local** (localhost), cette URL n’est pas joignable depuis Internet, donc **ne pas définir** `SHWARY_CALLBACK_URL` en dev : le code n’enverra pas d’URL de callback à Shwary (ou une URL http serait ignorée). **Après déploiement sur Render**, définir `SHWARY_CALLBACK_URL=https://ton-api.onrender.com/api/shwary/callback` dans les variables d’environnement du service. Pour tester les webhooks en local, utiliser un tunnel (ex. ngrok) et mettre l’URL ngrok dans `SHWARY_CALLBACK_URL`.

**Webhook Shwary (clé secrète)**  
Actuellement Shwary ne propose pas de configuration webhook (URL + clé) dans leur dashboard. **Ne pas définir** `SHWARY_WEBHOOK_SECRET` ni `PAYMENT_WEBHOOK_SECRET` : le callback accepte alors les requêtes sans vérification de signature, et les paiements sont bien mis à jour.  
Si Shwary ajoute plus tard une page pour configurer l’URL de callback et une clé secrète : générer une clé avec `php -r "echo bin2hex(random_bytes(32));"`, la mettre dans Render et dans leur dashboard ; le backend vérifiera alors l’en-tête `x-shwary-signature` et renverra 403 si la signature est invalide.

**Base de données :** Render propose PostgreSQL (créer une **PostgreSQL** dans le dashboard). Pour MySQL, utilise un service externe (ex. PlanetScale, Railway, ou DB hébergée ailleurs).

Après la première création du service, lancer les migrations (une fois) :

- **Render** : onglet **Shell** du service, puis :
  ```bash
  php artisan migrate --force
  ```

---

## 3. Frontend Next.js sur Vercel

Le frontend doit être déployé sur **Vercel** (recommandé pour Next.js).

### 3.1 Créer le projet

1. Va sur [vercel.com](https://vercel.com) et connecte-toi (ou crée un compte).
2. **Add New** → **Project**.
3. **Import** le dépôt GitHub (ex. `green-express`).
4. **Configure Project** :
   - **Root Directory** : clique sur **Edit** et choisis `frontend-next` (pas la racine du dépôt).
   - **Framework Preset** : Vercel détecte Next.js automatiquement.
   - **Build Command** : laisser par défaut (`next build`) ou vide.
   - **Output Directory** : laisser par défaut (`.next` pour Next.js).
   - **Install Command** : `npm install` ou `npm ci`.

### 3.2 Variables d’environnement (Frontend sur Vercel)

Dans **Settings** → **Environment Variables** du projet Vercel, ajoute :

| Variable | Valeur | Environnement |
|----------|--------|----------------|
| `NEXT_PUBLIC_API_URL` | URL du backend Render, ex. `https://green-express-api.onrender.com` (sans `/api` à la fin) | Production (et Preview si besoin) |

Important : en production, le front (Vercel) et l’API (Render) sont sur des domaines différents. Côté backend, **CORS** et **Sanctum** doivent autoriser l’origine du frontend (ex. `https://green-express.vercel.app` ou ton domaine personnalisé Vercel).

### 3.3 Déployer

Clique sur **Deploy**. Vercel build et déploie le frontend ; l’URL sera du type `https://green-express-xxx.vercel.app` ou ton domaine personnalisé.

---

## 4. Le frontend (Vercel) communique-t-il bien avec l’API (Render) ?

Oui, **à condition** que les réglages suivants soient faits côté backend (Render) et frontend (Vercel).

### Côté Backend (Render)

1. **CORS**  
   `CORS_ALLOWED_ORIGINS` doit contenir **exactement** l’URL du frontend (ex. `https://green-express.vercel.app`).  
   Le backend renverra alors `Access-Control-Allow-Origin: https://green-express.vercel.app` et `Access-Control-Allow-Credentials: true`, ce qui permet au navigateur d’accepter les réponses et d’envoyer les cookies.

2. **Sanctum (domaines stateful)**  
   `SANCTUM_STATEFUL_DOMAINS` doit contenir le **domaine** du frontend (ex. `green-express.vercel.app`, sans `https://`).  
   Sanctum considère alors les requêtes venant de ce domaine comme « stateful » et gère correctement la session (cookies).

3. **Cookies de session en cross-origin**  
   Front (Vercel) et API (Render) sont sur des **domaines différents**. Pour que le navigateur envoie les cookies de session avec chaque requête :
   - **`SESSION_SAME_SITE=none`** (obligatoire pour les cookies cross-site).
   - **`SESSION_SECURE_COOKIE=true`** (obligatoire quand SameSite=none ; Render est en HTTPS).

Sans ces deux variables, la connexion (login) et les appels API authentifiés peuvent échouer en production.

### Côté Frontend (Vercel)

- **`NEXT_PUBLIC_API_URL`** doit être l’URL complète du backend (ex. `https://green-express-api.onrender.com`, **sans** `/api` à la fin).  
  Le front envoie déjà toutes les requêtes avec `credentials: 'include'` (voir `app/lib/api.js`), ce qui est nécessaire pour les cookies Sanctum.

### En résumé

| Où | Variable / réglage | Rôle |
|----|--------------------|------|
| Render (backend) | `CORS_ALLOWED_ORIGINS` | Autoriser l’origine Vercel pour les requêtes cross-origin. |
| Render (backend) | `SANCTUM_STATEFUL_DOMAINS` | Traiter le domaine Vercel comme SPA stateful (cookies). |
| Render (backend) | `SESSION_SAME_SITE=none` | Permettre l’envoi des cookies vers un autre domaine (Vercel → Render). |
| Render (backend) | `SESSION_SECURE_COOKIE=true` | Exigé par le navigateur quand SameSite=none (HTTPS). |
| Vercel (frontend) | `NEXT_PUBLIC_API_URL` | URL de l’API Render pour tous les appels. |

Une fois ces réglages en place, le frontend sur Vercel communique valablement avec l’API Laravel sur Render (login, session, appels API).

---

## 5. Ordre de déploiement

1. Créer le **dépôt GitHub** et pousser le code.
2. Créer la **base de données** (PostgreSQL sur Render ou MySQL ailleurs).
3. Créer le **Web Service Backend** sur **Render** (Laravel), renseigner les variables d’environnement, déployer, puis lancer `php artisan migrate --force` en Shell.
4. Noter l’URL du backend (ex. `https://green-express-api.onrender.com`).
5. Créer le **projet Frontend** sur **Vercel** (root `frontend-next`), définir `NEXT_PUBLIC_API_URL` = URL du backend, déployer.
6. Noter l’URL du frontend (ex. `https://green-express.vercel.app`).
7. Mettre à jour le backend sur Render : `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL` avec l’URL réelle du frontend **Vercel**.
8. Redéployer le backend sur Render si tu as changé des variables.

---

## 6. Fichiers sensibles (ne jamais les committer)

- `backend/.env`
- `frontend-next/.env.local`
- Tout fichier contenant mots de passe, clés API, secrets.

Ils sont déjà listés dans les `.gitignore` du projet. Vérifier avec `git status` avant chaque commit.

---

## 7. Après déploiement

- **Webhook Shwary** : dans le dashboard Shwary, configurer l’URL de callback :  
  `https://TON-BACKEND.onrender.com/api/shwary/callback`.
- **HTTPS** : Render et Vercel fournissent HTTPS ; nécessaire pour les cookies de session cross-origin (Sanctum) et pour Shwary.
- **Cold start** : sur l’offre gratuite Render, le backend peut s’endormir ; le premier appel peut être lent.
- **Résumé** : **Backend = Render**, **Frontend = Vercel**, code source sur **GitHub**.
