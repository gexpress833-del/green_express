# Green Express – Authentification Sanctum + Spatie Permission

Architecture d’authentification pour une SPA Next.js avec un backend Laravel (session cookies, rôles et permissions).

---

## 1. Vue d’ensemble

- **Backend** : Laravel avec **Laravel Sanctum** (session + cookies httpOnly pour la SPA).
- **Frontend** : Next.js (App Router), session portée par les **cookies** (pas de token en `localStorage`).
- **Rôles** : colonne `role` sur `users` + **Spatie Laravel Permission** pour permissions fines.
- **Session** : durée configurable (ex. 3–7 jours via `SESSION_LIFETIME`).

---

## 2. Backend (Laravel)

### 2.1 Configuration déjà en place

- **Sanctum** : `config/sanctum.php` → `stateful` = domaines du frontend.
- **CORS** : `config/cors.php` → `supports_credentials` = `true`, `allowed_origins` selon l’env.
- **Session** : `config/session.php` → `lifetime` (ex. 10080 = 7 jours).
- **Kernel** : groupe `api` avec `EnsureFrontendRequestsAreStateful` (Sanctum).
- **AuthController** : login / register / logout / user (session, plus de JWT pour la SPA).
- **Routes** : `/api/login`, `/api/register`, `/api/logout`, `/api/user`, `/api/me`, `/api/dashboard` ; le reste sous `auth:sanctum`.

### 2.2 Variables d’environnement Laravel (`.env`)

```env
# Session (10080 = 7 jours en minutes)
SESSION_DRIVER=database
SESSION_LIFETIME=10080
SESSION_DOMAIN=

# Sanctum SPA
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

En production (front et API sur domaines différents, HTTPS) :

```env
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
SESSION_DOMAIN=.votredomaine.com
SANCTUM_STATEFUL_DOMAINS=votrefront.com,api.votredomaine.com
CORS_ALLOWED_ORIGINS=https://votrefront.com
```

### 2.3 Spatie Laravel Permission

**Installation :**

```bash
cd backend
composer update
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
```

**Rôles créés** (alignés avec la colonne `role`) : `admin`, `client`, `cuisinier`, `livreur`, `entreprise`, `verificateur`.

**Permissions créées** :  
`gérer utilisateurs`, `gérer commandes`, `voir statistiques`, `gérer menus`, `gérer promotions`, `gérer entreprises`, `valider livraisons`, `valider tickets promotion`.

**Utilisation dans les routes :**

```php
Route::middleware(['auth:sanctum', 'permission:gérer utilisateurs'])->group(function () {
    // ...
});
```

**Commande pour réinitialiser rôles/permissions et réassigner les utilisateurs :**

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

---

## 3. Frontend (Next.js)

### 3.1 Variables d’environnement (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

En production : l’URL de l’API (ex. `https://api.greenexpress.com`).

### 3.2 Comportement

- **Cookies** : toutes les requêtes vers l’API sont envoyées avec `credentials: 'include'` (pas de token en localStorage).
- **CSRF** : avant `login` / `register`, le front appelle `GET /sanctum/csrf-cookie` avec `credentials: 'include'`.
- **Utilisateur** : `GET /api/user` (ou `/api/me`) avec cookies pour connaître la session.
- **useAuth()** : fournit `user`, `loading`, `initialised`, `login`, `logout`, `refreshUser` ; au focus fenêtre, `refreshUser()` est rappelé pour rafraîchir la session sans redirection inutile.
- **Redirection après login** : selon `returnUrl` (query) ou selon `user.role` → `/admin`, `/client`, `/livreur`, etc.
- **Pages protégées** : `RequireAuth` dans les layouts (`/client`, `/admin`, `/profile`, `/cuisinier`) ; si pas de session, redirection vers `/login?returnUrl=...`.

### 3.3 Exemple d’appel API (fetch)

```js
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
  method: 'GET',
  credentials: 'include',
  headers: { Accept: 'application/json' },
});
```

---

## 4. Flux de connexion

1. L’utilisateur ouvre la page de login Next.js.
2. Il soumet email / mot de passe.
3. Le front appelle `GET /sanctum/csrf-cookie` (credentials), puis `POST /api/login` (credentials, JSON).
4. Laravel valide, ouvre une session et renvoie un cookie de session (httpOnly, Secure en prod).
5. Le front reçoit `{ user }`, met à jour le contexte (`useAuth`), puis redirige vers `returnUrl` ou `/${user.role}`.
6. Les requêtes suivantes (ex. `GET /api/user`, menus, commandes) envoient le cookie ; Laravel authentifie via `auth:sanctum`.

---

## 5. Sécurité

- **Cookies** : session Laravel (httpOnly, Secure en HTTPS, SameSite configuré).
- **Pas de token** côté front (pas de Bearer en localStorage).
- **CORS** : origines explicites, `supports_credentials` pour les cookies.
- **Routes API** : protégées par `auth:sanctum` ; contrôle fin par `role` / `permission` (Spatie) si besoin.

---

## 6. Déploiement (rappel)

- Backend et front sur **HTTPS** en production.
- Même domaine ou sous-domaines cohérents pour les cookies (ou `SESSION_DOMAIN` / `SANCTUM_STATEFUL_DOMAINS` bien réglés).
- Tables `sessions` (Laravel) et tables Spatie (`roles`, `permissions`, etc.) migrées et seedées.
