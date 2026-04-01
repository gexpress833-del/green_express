# Green Express — Fonctionnement global de l’application

Ce document décrit **ce qu’est Green Express**, **à qui elle s’adresse**, **comment les différents acteurs collaborent** dans la vraie vie, puis **comment cela se traduit techniquement** (sans entrer dans chaque fichier source).

---

## 1. Qu’est-ce que Green Express ?

**Green Express** est une **plateforme web** de **commande de repas** et de **gestion de livraison**, pensée pour un usage au **contexte RDC** (numéros téléphone, Mobile Money, devises CDF/USD selon les écrans).

En pratique, l’application permet de :

| Besoin | Ce que fait l’app |
|--------|-------------------|
| **Manger sans se déplacer** | Le **client** parcourt des **menus** (plats), compose une **commande** avec adresse de livraison et **paie en Mobile Money**. |
| **Sécuriser la livraison** | Après paiement validé, un **code de livraison** est généré ; le **livreur** et le **client** s’en servent pour se retrouver. |
| **Fidéliser** | **Points**, **promotions** (réductions ou avantages en échange de points), historique de commandes. |
| **Alimenter les cartes** | Les **cuisiniers** (ou l’équipe cuisine) **proposent des plats** ; l’**admin** valide ou refuse avant mise en ligne. |
| **Piloter** | L’**admin** supervise commandes, menus, promotions, utilisateurs, abonnements, etc. |
| **B2B / cantines** | Les comptes **entreprise** gèrent des **abonnements repas** pour des groupes (agents, équipes), avec workflows de validation selon les règles métier. |
| **Anti-fraude promos** | Un **vérificateur** peut **valider des tickets** liés aux promotions (usage terrain / événements). |

L’interface publique (Next.js) parle à une **API Laravel** ; l’authentification repose sur des **sessions sécurisées** (cookies + Sanctum), pas sur un token stocké dans le navigateur en clair.

---

## 2. Les acteurs et leurs rôles (vue métier)

### Client
- S’inscrit, consulte les **menus**, passe des **commandes**, paie (**Mobile Money**), consulte l’**historique**, les **notifications**, le **profil**, les **promotions**, les **abonnements** (selon offres).
- Reçoit un **code de livraison** une fois le paiement confirmé (selon flux commande).

### Cuisinier
- Crée et gère **ses plats** (menus) ; les nouvelles fiches peuvent être **en attente de validation** par l’admin.
- Utilise l’upload d’**images** (ex. Cloudinary) pour illustrer les plats.

### Livreur
- Voit les **livraisons / assignations** qui le concernent.
- Intervient dans la chaîne entre cuisine validée et **remise au client** (statuts de commande, code de livraison selon les écrans prévus).

### Administrateur
- **Valide** les menus, gère **utilisateurs**, **commandes**, **promotions**, **plans d’abonnement**, **notifications** (y compris annonces), **paiements** / suivi, etc.
- C’est le centre de pilotage opérationnel.

### Entreprise
- Représente une structure (cantine, institution, etc.) avec **demandes d’abonnement**, **budget**, **employés** ou agents selon le modèle implémenté (inscription entreprise, validation admin, etc.).

### Vérificateur
- Rôle dédié à la **validation de tickets** ou codes liés aux **promotions** (contrôle sur le terrain ou lors d’événements).

Chaque rôle accède à un **espace dédié** (`/client`, `/admin`, `/livreur`, etc.) ; le frontend **refuse** l’accès aux tableaux de bord qui ne correspondent pas au `role` de l’utilisateur connecté.

---

## 3. Parcours types (comment « ça vit » dans l’app)

### A. Commande d’un plat (client)
1. Le client se **connecte** (e-mail ou numéro RDC + mot de passe).
2. Il choisit un ou plusieurs plats (**panier** ou **commande rapide** depuis un menu).
3. Il renseigne l’**adresse de livraison** et le **numéro Mobile Money** utilisé pour payer.
4. La commande est créée côté API (souvent statut **en attente de paiement**).
5. Le client **initie le paiement** Mobile Money ; le backend dialogue avec le **prestataire de paiement** (pawaPay / logique documentée dans le dépôt).
6. Quand le paiement est **confirmé** (callback ou job de relance), la commande passe au statut adapté et un **code de livraison** peut être généré / affiché.
7. Le **livreur** (ou la cuisine) enchaîne selon les statuts prévus jusqu’à la livraison.

### B. Publication d’un plat (cuisinier → admin)
1. Le cuisinier **crée** un menu (plat) avec prix, description, image.
2. Tant que l’admin n’a pas validé, le plat peut rester **non visible** ou **en attente** selon la règle métier.
3. L’**admin** **approuve** ou **rejette** ; les clients ne voient que ce qui est validé.

### C. Promotion et points
1. L’**admin** crée une **promotion** (règles, stock, points requis, etc.).
2. Le **client** consulte les promos et peut **réclamer** une offre si ses **points** et les règles le permettent (souvent avec **ticket** ou code).
3. Le **vérificateur** peut **contrôler** certains tickets en contexte réel.

### D. Entreprise et abonnements
1. Une **entreprise** peut **s’inscrire** ou gérer son compte selon les écrans (demande en attente, validation admin).
2. Les **abonnements** (repas récurrents, formules) passent par des flux dédiés avec **paiement** et suivi d’état (validation équipe, etc.).

---

## 4. Côté technique (résumé fidèle au code)

### 4.1 Authentification (Sanctum + cookies)
- **Backend** : `POST /api/login` avec identifiant `login` (e-mail **ou** téléphone RDC) + `password` ; session créée ; réponse `{ user }`.
- **CSRF** : le frontend appelle `GET /sanctum/csrf-cookie` avant les requêtes modifiant l’état.
- **Utilisateur courant** : `GET /api/user` avec cookies de session.
- **Déconnexion** : `POST /api/logout`.
- **Frontend** : `AuthContext` charge l’utilisateur au démarrage ; `apiRequest` envoie `credentials: 'include'` et le jeton CSRF pour les méthodes autres que GET.

### 4.2 Protection des routes (Next.js)
- Composants du type **RequireAuth** (connecté obligatoire), **AdminGuard**, **RoleGuard** : empêchent un **livreur** d’ouvrir `/admin`, etc.
- Les pages **login** / **register** / **accueil** restent publiques.

### 4.3 API métier (extraits)
- **Commandes** : création `POST /api/orders` ; paiement `POST /api/orders/{id}/initiate-payment` (numéro Mobile Money, pays / opérateur selon configuration).
- **Menus** : consultation publique ou authentifiée ; création / édition côté cuisinier ; modération admin.
- **Promotions, points, abonnements, notifications** : routes dédiées sous les contrôleurs Laravel (voir `docs/API.md` pour le détail).

### 4.4 Paiements Mobile Money
- Les flux sont décrits dans `docs/LOGIQUE_PAIEMENT_MOBILE_MONEY.md` et fichiers voisins (callbacks, jobs de relance si un webhook manque).
- Idée générale : **dépôt** côté agrégateur → **confirmation** → mise à jour **commande** / **abonnement** et **paiement** en base.

### 4.5 Fichiers et médias
- Images souvent hébergées via **Cloudinary** (upload depuis l’admin ou le cuisinier selon les écrans).

---

## 5. Déploiement typique (rappel)

- **Backend** : souvent **Render** (Docker / Laravel), base **PostgreSQL** gérée, variables d’environnement pour l’API, la base, CORS, sessions, clés Cloudinary / paiement.
- **Frontend** : souvent **Vercel** (Next.js), variable `NEXT_PUBLIC_API_URL` pointant vers l’URL publique du backend.
- **CORS / Sanctum** : le domaine du front doit être autorisé (`SANCTUM_STATEFUL_DOMAINS`, `CORS_ALLOWED_ORIGINS`, cookies `SameSite` en HTTPS).

---

## 6. Développement local (raccourci)

1. Backend : `cd backend && composer install && php artisan migrate` puis `php artisan serve` (port 8000 par défaut).
2. Frontend : `cd frontend-next && npm install && npm run dev` (port 3000).
3. `.env` backend : `APP_URL`, `FRONTEND_URL`, CORS alignés sur `http://localhost:3000`.
4. Frontend : `NEXT_PUBLIC_API_URL=http://localhost:8000` (sans suffixe `/api` si c’est ainsi que `api.js` est écrit).

Comptes de test **locaux** : voir les seeders (`UsersTableSeeder`, etc.) — en **production**, les e-mails et mots de passe de démo peuvent différer (`*@greenexpress.com`, commande `create:production-users`, etc.).

---

## 7. Checklist « tout va bien »

- [ ] Connexion client → redirection vers `/client` ; un autre rôle ne peut pas ouvrir cet espace.
- [ ] Connexion admin → `/admin` accessible ; accès à un autre rôle refusé ou redirigé.
- [ ] Création de commande + tentative de paiement (sandbox ou prod selon config).
- [ ] Menu créé par un cuisinier puis visible côté admin pour validation.
- [ ] Promotions et points : pas d’erreur bloquante sur les écrans principaux.

---

## 8. En cas de problème

| Symptôme | Piste |
|----------|--------|
| 401 après login | Cookie de session non envoyé (CORS, `credentials`, domaine front/back). |
| `auth.failed` / identifiants incorrects | Utilisateur inexistant sur **cette** base (local vs prod) ou mauvais mot de passe. |
| CSRF / 419 | Appeler `sanctum/csrf-cookie` avant le premier POST. |
| Paiement bloqué | Vérifier clés API, URL de callback, logs Laravel, job de relance. |

---

*Document mis à jour pour décrire le fonctionnement métier et technique de Green Express de façon lisible pour un humain ; le détail des routes reste dans `docs/API.md` et le code source.*
