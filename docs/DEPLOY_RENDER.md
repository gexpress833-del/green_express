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

Sur Render, **PHP n’apparaît pas** dans la liste des runtimes. Il faut utiliser **Docker** : le backend Laravel est livré avec un `Dockerfile` dans `backend/`.

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connecte ton compte GitHub et choisis le dépôt (ex. `green_express`).
3. Configuration :
   - **Name** : `green-express-api` (ou au choix).
   - **Root Directory** : `backend`.
   - **Environment / Langue** : choisis **Docker** (pas Node, pas PHP).
   - **Region** : celle la plus proche de tes utilisateurs.

Render va construire l’image à partir du `Dockerfile` dans `backend/` (install Composer, cache config/routes, puis au démarrage : migrations + `php artisan serve` sur le `PORT` fourni par Render). Tu n’as **pas** à remplir Build Command ni Start Command quand tu utilises un Dockerfile.

### 2.3 Variables d’environnement (Backend sur Render)

À définir dans **Environment** du service Render (onglet **Environment**). Ne jamais committer le fichier `.env`.

#### Liste pas à pas (à remplir dans l’ordre sur Render)

**1. Application Laravel**
- `APP_ENV` = `production`
- `APP_DEBUG` = `false`
- `APP_KEY` = sortie de `php artisan key:generate --show` (en local, une fois)
- `APP_URL` = `https://TON-SERVICE.onrender.com` (remplacer par l’URL réelle du Web Service après création)

**2. Base de données**  
*(Si tu crées une base PostgreSQL sur Render, récupère l’**Internal Database URL** dans le dashboard.)*
- **Option A (recommandée avec PostgreSQL Render)** : définir uniquement  
  `DB_CONNECTION` = `pgsql`  
  `DB_URL` = l’URL interne fournie par Render (ex. `postgres://user:pass@dpg-xxx.oregon-postgres.render.com/dbname`).  
  Laravel utilisera cette URL pour la connexion.
- **Option B (variables séparées)** :  
  `DB_CONNECTION` = `pgsql` ou `mysql`  
  `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` = selon ta base.

**3. Session & cache (obligatoire pour Sanctum + cookies cross-origin)**
- `SESSION_DRIVER` = `database`
- `SESSION_CONNECTION` = `pgsql` ou `mysql` (même que `DB_CONNECTION`)
- `SESSION_SAME_SITE` = `none`
- `SESSION_SECURE_COOKIE` = `true`
- `CACHE_STORE` = `database`

**4. Frontend (Vercel) — à adapter avec ton URL Vercel**
- `SANCTUM_STATEFUL_DOMAINS` = `ton-projet.vercel.app` (sans `https://`)
- `CORS_ALLOWED_ORIGINS` = `https://ton-projet.vercel.app`
- `FRONTEND_URL` = `https://ton-projet.vercel.app`

**5. Cloudinary (images menus / promotions)**
- `CLOUDINARY_CLOUD_NAME` = ton Cloud Name
- `CLOUDINARY_API_KEY` = ta clé API
- `CLOUDINARY_API_SECRET` = ton secret

**6. Shwary (paiements Mobile Money)**
- `SHWARY_MERCHANT_ID` = ton ID marchand
- `SHWARY_MERCHANT_KEY` = ta clé marchande
- `SHWARY_MOCK` = `false`
- `SHWARY_SANDBOX` = `false` (ou `true` pour tester)
- `SHWARY_CALLBACK_URL` = `https://TON-SERVICE.onrender.com/api/shwary/callback` (après déploiement, avec la vraie URL du service)
- *(Optionnel)* `SHWARY_WEBHOOK_SECRET` ou `PAYMENT_WEBHOOK_SECRET` : ne pas définir pour l’instant (Shwary n’a pas de config webhook).

**7. Taux Shwary (si menus en USD)**  
*(Optionnel, valeurs par défaut déjà dans le code.)*
- `SHWARY_RATE_USD_TO_CDF` = `2500`
- `SHWARY_RATE_USD_TO_KES` = `130`
- `SHWARY_RATE_USD_TO_UGX` = `3800`
- `SHWARY_DEFAULT_ORDER_CURRENCY` = `USD`

---

**Tableau récapitulatif** (référence rapide)

| Variable | Exemple / Note |
|----------|-----------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `php artisan key:generate --show` |
| `APP_URL` | `https://green-express-api.onrender.com` |
| `DB_CONNECTION` | `pgsql` ou `mysql` |
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | Selon ta base |
| `SESSION_DRIVER` | `database` |
| `SESSION_CONNECTION` | `pgsql` ou `mysql` |
| `SESSION_SAME_SITE` | `none` |
| `SESSION_SECURE_COOKIE` | `true` |
| `CACHE_STORE` | `database` |
| `SANCTUM_STATEFUL_DOMAINS` | Domaine Vercel sans https |
| `CORS_ALLOWED_ORIGINS` | URL complète du frontend Vercel |
| `FRONTEND_URL` | URL complète du frontend Vercel |
| `CLOUDINARY_*` | Tes clés Cloudinary |
| `SHWARY_*` | Tes clés + `SHWARY_CALLBACK_URL` après déploiement |

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
