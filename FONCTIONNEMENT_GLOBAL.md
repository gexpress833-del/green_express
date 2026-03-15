# Green Express – Fonctionnement global de l’application

**Objectif :** S’assurer que l’application fonctionne de bout en bout pour tous les rôles et flux principaux.

---

## 1. Authentification (Sanctum, cookies)

### Backend
- **Login** : `POST /api/login` (email, password) → crée la session, renvoie `{ user }`.
- **Register** : `POST /api/register` (name, email, password) → crée l’utilisateur (rôle `client`), connecte en session, renvoie `{ user }`.
- **Register entreprise** : `POST /api/register-company` → crée user + company (statut `pending`), pas de connexion auto.
- **Utilisateur courant** : `GET /api/user` (ou `/api/me`) avec cookie de session → renvoie l’objet `user` (dont `role`).
- **Logout** : `POST /api/logout` → invalide la session.
- **CSRF** : le frontend appelle `GET /sanctum/csrf-cookie` avant tout POST/PUT/DELETE.

### Frontend
- **AuthContext** : au chargement, appelle `getMe()` pour vérifier la session ; expose `user`, `login`, `logout`, `refreshUser`.
- **Login** : appelle `getCsrfCookie()` puis `POST /api/login` ; après succès, redirige vers `returnUrl` ou `/${user.role}`.
- **Requête API** : `apiRequest()` dans `app/lib/api.js` envoie toujours `credentials: 'include'` et le header `X-XSRF-TOKEN` pour les requêtes non-GET.

### À vérifier en local
1. Démarrer le backend : `cd backend && php artisan serve` (port 8000).
2. Démarrer le frontend : `cd frontend-next && npm run dev` (port 3000).
3. `.env` backend : `FRONTEND_URL=http://localhost:3000`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`.
4. `.env.local` frontend : `NEXT_PUBLIC_API_URL=http://localhost:8000` (sans `/api`).
5. Ouvrir http://localhost:3000/login → se connecter avec un compte (ex. `client@test.com` / `password`) → vérifier la redirection vers `/client`.

---

## 2. Protection des routes (auth + rôle)

### En place
- **RequireAuth** : redirige vers `/login?returnUrl=...` si l’utilisateur n’est pas connecté. Utilisé dans tous les layouts des zones protégées.
- **AdminGuard** : pour `/admin/*`, redirige vers `/${user.role}` si le rôle n’est pas `admin`.
- **RoleGuard** : pour un segment donné (ex. `/livreur`, `/entreprise`, `/verificateur`, `/cuisinier`, `/client`), redirige vers `/${user.role}` si le rôle ne correspond pas.

### Layouts
| Segment      | Layout                          | Comportement |
|-------------|-----------------------------------|--------------|
| `/admin/*`  | RequireAuth + AdminGuard         | Admin uniquement |
| `/client/*` | RequireAuth + RoleGuard( client )| Client uniquement |
| `/cuisinier/*` | RequireAuth + RoleGuard( cuisinier ) | Cuisinier uniquement |
| `/livreur/*`   | RequireAuth + RoleGuard( livreur )   | Livreur uniquement |
| `/verificateur/*` | RequireAuth + RoleGuard( verificateur ) | Vérificateur uniquement |
| `/entreprise/*`  | RequireAuth + RoleGuard( entreprise )  | Entreprise uniquement |
| `/login`, `/register`, `/` | Pas de RequireAuth | Accessible à tous |

### À vérifier
- Se connecter en tant que **client** → accès à `/client` uniquement ; toute tentative d’accès à `/admin` ou `/livreur` doit rediriger vers `/client`.
- Idem pour les autres rôles (admin, cuisinier, livreur, verificateur, entreprise).

---

## 3. Flux métier principaux

### Client
- **Tableau de bord** : `GET /api/client/stats` → points, commandes, abonnements.
- **Menus** : `GET /api/menus/public/browse` ou `/api/menus/browse` (connecté) ; création commande : `POST /api/orders` avec `items`, `delivery_address`.
- **Promotions** : `GET /api/promotions?active_only=1&current=1` (ou `visible_to_client=1`) ; réclamation : `POST /api/promotions/{id}/claim` (déduction des points, ticket généré).
- **Commandes** : liste `GET /api/orders` ; paiement Shwary : `POST /api/orders/{id}/initiate-payment` puis suivi du statut.

### Cuisinier
- **Menus** : `GET /api/my-menus` ; création `POST /api/menus` (statut `pending` jusqu’à approbation admin).
- **Upload image** : `POST /api/upload-image` (multipart) → Cloudinary.

### Admin
- **Menus** : `GET /api/menus` (tous, filtre status) ; approbation/rejet via `PUT /api/menus/{id}`.
- **Promotions** : `GET /api/promotions`, `POST /api/promotions`, `PUT/DELETE` sur une promotion.
- **Commandes, utilisateurs, paiements, abonnements, rapports** : routes dédiées sous `/api/admin/*` ou par contrôleur.

### Livreur
- **Stats** : `GET /api/livreur/stats` ; **assignations** : `GET /api/livreur/assignments` ; **validation code** : `POST /api/orders/{uuid}/validate-code`.

### Vérificateur
- **Stats** : `GET /api/verificateur/stats` ; **historique** : `GET /api/verificateur/history` ; **validation ticket** : `POST /api/verificateur/validate-ticket` (ou endpoint dédié selon le backend).

### Entreprise
- **Stats** : `GET /api/entreprise/stats` ; **entreprises** : `GET /api/companies` ; **employés, abonnements, livraisons** : routes sous `/api/companies/{id}/*` et associées.

---

## 4. Corrections récentes (pour le fonctionnement global)

1. **Navbar** : suppression de l’appel à `setNotifications(...)` qui utilisait une variable non définie (seul `unreadCount` est utilisé dans la Navbar).
2. **Layouts manquants** : ajout de `layout.jsx` pour **livreur**, **verificateur**, **entreprise** avec `RequireAuth` + `RoleGuard(role)` pour protéger ces segments et rediriger les mauvais rôles.
3. **RoleGuard** : nouveau composant réutilisable `RoleGuard({ role, children })` pour restreindre un segment à un rôle.
4. **Cuisinier et Client** : utilisation de `RoleGuard` dans leurs layouts pour que seuls les rôles `cuisinier` et `client` accèdent à leurs dashboards.

---

## 5. Checklist rapide de vérification

- [ ] Backend et frontend démarrés ; CORS et `NEXT_PUBLIC_API_URL` corrects.
- [ ] Connexion depuis `/login` avec un compte client → redirection vers `/client`.
- [ ] Connexion avec admin → accès à `/admin` ; tentative d’accès à `/client` → redirection vers `/admin`.
- [ ] Déconnexion → redirection vers `/` ; accès à `/client` sans être connecté → redirection vers `/login?returnUrl=...`.
- [ ] Page d’accueil `/` : promotions et plans d’abonnement publics chargés sans erreur.
- [ ] Client : dashboard, menus, création de commande, réclamation de promotion (avec points suffisants).
- [ ] Cuisinier : création de menu avec upload d’image.
- [ ] Admin : liste des menus (dont pending), approbation ; liste des promotions.
- [ ] Livreur / Vérificateur / Entreprise : accès à leur dashboard et stats sans erreur 401/403.

---

## 6. En cas de problème

- **401 sur les requêtes après login** : vérifier que le cookie de session est bien envoyé (même origine ou CORS avec `credentials: true`), et que `getCsrfCookie()` est appelé avant le premier POST (login).
- **Redirection en boucle** : vérifier que `GET /api/user` renvoie bien l’objet user avec `role` ; que les layouts n’exigent pas un rôle différent de celui de l’utilisateur.
- **CORS** : `config/cors.php` doit avoir `supports_credentials => true` et `allowed_origins` contenant `http://localhost:3000`.

Une fois ces points validés, l’application peut être considérée comme fonctionnelle globalement pour tous les rôles et flux décrits ci-dessus.
