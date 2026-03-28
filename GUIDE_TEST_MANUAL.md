# Guide de test manuel – Green Express

Test pas à pas pour valider le fonctionnement de l’application en conditions réelles.

---

## Nettoyage pré-production (effectué)

- **Supprimé** : `frontend-next/app/components/ProtectedRoute.jsx` (remplacé par `RequireAuth`)
- **Supprimé** : `frontend-next/app/components/ImageUploader.jsx` (jamais importé)
- **Supprimé** : `frontend-next/app/client/getons/page.jsx` (page orpheline, non liée)
- **Corrigé** : Lien mort « Statistiques de vente » sur le dashboard cuisinier (bouton retiré, page `/cuisinier/sales` inexistante)

Dossier vide `app/client/getons/` : à supprimer manuellement si besoin.

---

## Tests automatisés (avant déploiement)

**Backend :** `cd backend` puis `php artisan test`  
- Certains tests peuvent échouer en local (Cloudinary 401, Livreur 403, E2E 502) selon la config auth/upload ; les tests PromotionClaim, Verificateur, Example passent.

**Frontend :** `cd frontend-next` puis `npm run build`  
- Vérifier « Compiled successfully » et « Generating static pages (53/53) ». Avertissement ESLint ou « deopted into client rendering » sur /login n’empêche pas le build.

---

## Prérequis

### 1. Démarrer le backend

```powershell
cd c:\SERVICE\backend
php artisan serve
```

Attendre : `Server running on [http://127.0.0.1:8000]`.

### 2. Démarrer le frontend (autre terminal)

```powershell
cd c:\SERVICE\frontend-next
npm run dev
```

Attendre : `Ready` (frontend sur http://localhost:3000).

### 3. Vérifier la config

- **Backend** `backend\.env` : `FRONTEND_URL=http://localhost:3000`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`
- **Frontend** `frontend-next\.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:8000`

### Comptes de test

| Rôle        | Email               | Mot de passe |
|------------|---------------------|--------------|
| Admin      | admin@test.com      | password     |
| Cuisinier  | cuisinier@test.com  | password     |
| Client     | client@test.com    | password (120 points) |
| Livreur    | livreur@test.com   | password     |
| Vérificateur | verificateur@test.com | password  |
| Entreprise | entreprise@test.com | password     |

---

## Partie 1 : Page d’accueil et accès sans compte

1. Ouvrir **http://localhost:3000**
2. Vérifier :
   - [ ] La page s’affiche (hero, logo, titre Green Express)
   - [ ] La section « Promotion du moment » charge (promotion ou message « Aucune promotion »)
   - [ ] La section « Types d’abonnement » charge (plans ou message « Aucun plan »)
3. Cliquer sur **Se connecter** (ou aller sur http://localhost:3000/login)
   - [ ] La page de login s’affiche sans erreur

---

## Partie 2 : Connexion et protection des routes

### Test 1 : Connexion Client

1. Sur **http://localhost:3000/login**, se connecter avec **client@test.com** / **password**
2. Vérifier :
   - [ ] Redirection vers **http://localhost:3000/client** (tableau de bord client)
   - [ ] Pas de message d’erreur dans la page
   - [ ] La navbar affiche « Tableau de bord », « Mon profil », « Notifications », « Se déconnecter »

### Test 2 : Accès interdit à un autre rôle

1. Toujours connecté en **client**, dans la barre d’adresse aller sur **http://localhost:3000/admin**
2. Vérifier :
   - [ ] Redirection automatique vers **http://localhost:3000/client**
3. Essayer **http://localhost:3000/livreur**
   - [ ] Redirection vers **http://localhost:3000/client**

### Test 3 : Déconnexion

1. Cliquer sur **Se déconnecter**
2. Vérifier :
   - [ ] Redirection vers la page d’accueil **http://localhost:3000**
   - [ ] La navbar affiche « Se connecter » et « S’inscrire »
3. Aller sur **http://localhost:3000/client**
   - [ ] Redirection vers **http://localhost:3000/login?returnUrl=%2Fclient** (ou équivalent)

### Test 4 : Connexion Admin

1. Se connecter avec **admin@test.com** / **password**
2. Vérifier :
   - [ ] Redirection vers **http://localhost:3000/admin**
   - [ ] Dashboard admin visible (menus, commandes, promotions, etc.)
3. Aller sur **http://localhost:3000/client**
   - [ ] Redirection vers **http://localhost:3000/admin**

---

## Partie 3 : Flux Client (dashboard, menus, promotions)

1. Se connecter en **client** (client@test.com / password)

### Dashboard

- [ ] La page **/client** affiche les cartes : Points fidélité, Commandes, Abonnements
- [ ] Les liens « Voir les promotions », « Voir les menus » fonctionnent

### Menus

1. Cliquer sur **Voir les menus** (ou aller sur **/client/menus**)
2. Vérifier :
   - [ ] La liste des menus s’affiche (ou message « Aucun menu »)
   - [ ] Pas d’erreur 401/403 en console (F12 → Console)
3. Si des menus existent : cliquer sur un menu pour aller sur la page de création de commande
   - [ ] La page **/client/orders/create?menu_id=...** s’affiche
   - [ ] Formulaire (quantité, adresse) visible ; pas d’erreur immédiate

### Promotions

1. Aller sur **/client/promotions**
2. Vérifier :
   - [ ] Une promotion s’affiche ou le message « Aucune promotion disponible »
   - [ ] Si une promotion est affichée et que le client a assez de points : le bouton « Réclamer » (ou équivalent) est utilisable
3. Optionnel : réclamer une promotion
   - [ ] Confirmation demandée ; après validation, message de succès et ticket (ou message d’erreur clair)

---

## Partie 4 : Flux Cuisinier (menus)

1. Se déconnecter puis se connecter avec **cuisinier@test.com** / **password**
2. Vérifier :
   - [ ] Redirection vers **http://localhost:3000/cuisinier**
   - [ ] Dashboard cuisinier visible

3. Aller sur la création de menu (lien « Créer un menu » ou **/cuisinier/menu/create** selon le menu)
4. Vérifier :
   - [ ] Formulaire avec titre, description, prix, devise, image
   - [ ] Choix d’image (upload) possible
5. Remplir le formulaire et soumettre (avec ou sans image)
   - [ ] Message de succès ou erreur explicite
   - [ ] Le nouveau menu apparaît en « En attente » (pending) dans la liste des menus cuisinier

---

## Partie 5 : Flux Admin (menus, promotions)

1. Se connecter avec **admin@test.com** / **password**
2. Aller sur **/admin/menus**
   - [ ] Liste des menus (tous statuts) ; filtres si présents
3. Si un menu est en « pending » : ouvrir sa fiche et l’approuver (bouton Approver / Valider)
   - [ ] Le statut passe à « approved » (ou équivalent)
4. Aller sur **/admin/promotions**
   - [ ] Liste des promotions
   - [ ] Création possible (lien ou bouton « Créer une promotion »)
5. Aller sur **/admin/orders**
   - [ ] Liste des commandes sans erreur

---

## Partie 6 : Autres rôles (Livreur, Vérificateur, Entreprise)

1. Se connecter avec **livreur@test.com** / **password**
   - [ ] Redirection vers **/livreur**
   - [ ] Dashboard livreur (stats, assignations) sans erreur 401/403
2. Se connecter avec **verificateur@test.com** / **password**
   - [ ] Redirection vers **/verificateur**
   - [ ] Dashboard verificateur (stats, historique, validation de ticket) sans erreur
3. Se connecter avec **entreprise@test.com** / **password**
   - [ ] Redirection vers **/entreprise**
   - [ ] Dashboard entreprise (stats, employés, abonnements, etc.) sans erreur

---

## Partie 7 : Paiement Mobile Money (pawaPay)

Le paiement Mobile Money passe par **pawaPay**. Le frontend initie le dépôt, puis le backend attend soit le callback `POST /api/pawapay/callback`, soit le fallback du scheduler.

### Configuration backend (.env)

Dans `backend\.env`, vérifier ou ajouter :

```env
PAWAPAY_API_TOKEN=votre_token
PAWAPAY_BASE_URL=https://api.sandbox.pawapay.io
PAWAPAY_CALLBACK_URL=https://votre-domaine.com/api/pawapay/callback
PAWAPAY_TIMEOUT=30
PAWAPAY_PROVIDER_COD_VODACOM=VODACOM_MPESA_COD
PAWAPAY_PROVIDER_COD_AIRTEL=AIRTEL_OAPI_COD
PAWAPAY_PROVIDER_COD_ORANGE=ORANGE_OAPI_COD
```

- Si `PAWAPAY_API_TOKEN` est vide : erreur « Service de paiement non configuré ».
- En sandbox, le paiement peut rester `pending` jusqu’au callback ou au fallback job.

### Test du flux commande → paiement

1. Se connecter en **client**. Aller sur **Menus**, choisir un plat, remplir quantité, adresse, numéro Mobile Money (ex. 812345678).
2. **Créer la commande** → étape Paiement (récap : N° commande, montant en FC, points).
3. Vérifier : montant en **FC** ; texte « Le montant sera débité en FC (CDF)… ».
4. **Payer avec Mobile Money** : vérifier le message d’initiation du paiement.
5. Si le paiement reste en attente : accepter sur le téléphone ; la page se met à jour par polling.

### Production

- `PAWAPAY_BASE_URL=https://api.pawapay.io`, token production et `PAWAPAY_CALLBACK_URL=https://votre-domaine.com/api/pawapay/callback` (HTTPS).

---

## Passage en production

### 1. Backend (Laravel)

Dans `backend\.env` sur le serveur de production :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.votre-domaine.com

# Base de données (MySQL/PostgreSQL de production)
DB_CONNECTION=mysql
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

# Session + cookies (HTTPS)
SESSION_DOMAIN=.votre-domaine.com
SESSION_SECURE_COOKIE=true
# Si frontend et API sur des sous-domaines différents (ex. app.xxx.com et api.xxx.com) :
# SESSION_SAME_SITE=none

# Frontend et CORS (URL réelle du site)
SANCTUM_STATEFUL_DOMAINS=app.votre-domaine.com,votre-domaine.com
FRONTEND_URL=https://app.votre-domaine.com
CORS_ALLOWED_ORIGINS=https://app.votre-domaine.com,https://votre-domaine.com

# pawaPay : production
PAWAPAY_API_TOKEN=<token_production>
PAWAPAY_BASE_URL=https://api.pawapay.io
PAWAPAY_CALLBACK_URL=https://api.votre-domaine.com/api/pawapay/callback
PAWAPAY_TIMEOUT=30

# Mail (envoi réel)
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=noreply@votre-domaine.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Commandes sur le serveur :**

```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan storage:link   # si stockage local des fichiers
# Démarrer avec PHP-FPM ou : php artisan serve (déconseillé en prod)
```

### 2. Frontend (Next.js)

Dans `frontend-next\.env.local` (ou variables d’environnement du déploiement) :

```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
```

**Build :**

```bash
cd frontend-next
npm ci
npm run build
# Servir avec : npm run start ou un serveur (Node, Vercel, etc.)
```

### 3. pawaPay (paiement)

| Variable | Valeur |
|----------|--------|
| `PAWAPAY_API_TOKEN` | Token **production** pawaPay |
| `PAWAPAY_BASE_URL` | `https://api.pawapay.io` |
| `PAWAPAY_CALLBACK_URL` | **HTTPS** uniquement, ex. `https://api.votre-domaine.com/api/pawapay/callback` |
| `PAWAPAY_WEBHOOK_SECRET` | Optionnel selon votre configuration de rappels signés |

Vérifier dans le tableau de bord pawaPay que l’URL de callback Deposits est bien celle configurée.

### 4. Sécurité

- **HTTPS** partout (frontend + API). Les cookies Sanctum en `secure` ne fonctionnent qu’en HTTPS.
- **Ne jamais commiter** `.env` (déjà dans `.gitignore`). Utiliser les variables d’environnement du serveur ou du hébergeur.
- **APP_DEBUG=false** et **APP_KEY** unique et secret en production.

### 5. Récap rapide

1. Héberger le backend (VPS, shared, Laravel Forge, etc.) avec PHP 8.x, MySQL/PostgreSQL.
2. Héberger le frontend (Vercel, Netlify, ou même le même serveur avec un reverse proxy).
3. Configurer le nom de domaine (ex. `api.votre-domaine.com` → backend, `app.votre-domaine.com` → frontend).
4. Renseigner les `.env` comme ci-dessus, activer pawaPay en production et le callback HTTPS.
5. Lancer migrations, `config:cache`, `npm run build` et démarrer les services.

---

## Récapitulatif

Cocher au fur et à mesure :

- [ ] Partie 1 : Accueil et login accessibles
- [ ] Partie 2 : Connexion, redirection par rôle, déconnexion, protection des routes
- [ ] Partie 3 : Client – dashboard, menus, promotions
- [ ] Partie 4 : Cuisinier – création de menu (et upload si testé)
- [ ] Partie 5 : Admin – menus, promotions, commandes
- [ ] Partie 6 : Livreur, Vérificateur, Entreprise – dashboards accessibles
- [ ] Partie 7 : Paiement Mobile Money – config, flux commande

Si un test échoue : noter l’étape, le message d’erreur (écran ou console F12) et la valeur de l’URL pour faciliter le diagnostic.

---

## Checklist globale avant mise en production

1. **Nettoyage** : Fichiers inutiles supprimés (voir section « Nettoyage pré-production » en tête de ce guide).
2. **Backend** : `php artisan test` — au minimum les tests critiques (promotions, verificateur, example) doivent passer.
3. **Frontend** : `npm run build` — doit terminer sans erreur (Compiled successfully).
4. **Test manuel** : Exécuter les Parties 1 à 7 de ce guide (accueil, connexion par rôle, client, cuisinier, admin, livreur/verificateur/entreprise, paiement pawaPay).
5. **Config production** : Suivre la section « Passage en production » (APP_DEBUG=false, HTTPS, CORS, Sanctum, pawaPay, mail).
6. **Sécurité** : Ne jamais commiter `.env` ; utiliser des variables d'environnement sur le serveur.
