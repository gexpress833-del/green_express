# Green Express – Référence API

Base URL : `http://127.0.0.1:8000/api` (dev) ou votre URL de déploiement.

Authentification : **JWT**. En-tête : `Authorization: Bearer <token>`.

Une spécification OpenAPI 3.0 minimale est disponible dans [openapi.yaml](openapi.yaml) pour import dans Postman, Swagger UI, etc.

---

## Auth

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Créer un compte |
| POST | `/login` | Obtenir un token JWT |
| GET | `/me` | Utilisateur courant (auth) |
| POST | `/logout` | Invalider le token (auth) |

---

## Menus

| Méthode | Endpoint | Rôle | Description |
|--------|----------|------|-------------|
| GET | `/menus` | admin | Liste des menus (pagination, filtre status) |
| GET | `/my-menus` | cuisinier | Menus du cuisinier |
| GET | `/menus/{id}` | admin | Détail d’un menu |
| POST | `/menus` | admin, cuisinier | Créer un menu (cuisinier → status pending) |
| PUT | `/menus/{id}` | admin, créateur | Modifier un menu |
| DELETE | `/menus/{id}` | admin, créateur | Supprimer un menu |

**Création (POST /menus)** : `title` (requis), `description`, `price` (requis), `currency` (ex. XAF), `image` (URL), `image_file` (multipart), `status`.

---

## Commandes (Orders)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Liste (admin: tout, autre: ses commandes) |
| POST | `/orders` | Créer une commande |
| POST | `/orders/{id}/initiate-payment` | Démarrer paiement (ex. Shwary) |
| POST | `/orders/{uuid}/validate-code` | Valider code livraison |

**Création (POST /orders)** : `items` (array de `{menu_id, quantity, price?}`), `delivery_address`, `company_id?`.

---

## Promotions

| Méthode | Endpoint | Rôle | Description |
|--------|----------|------|-------------|
| GET | `/promotions` | public | Liste des promotions (pagination, `active_only`, `menu_id`) |
| POST | `/promotions` | admin | Créer une promotion |
| POST | `/promotions/{id}/claim` | client | Réclamer une promotion (déduction points) |
| GET | `/my-promotion-claims` | client | Historique des réclamations |

**Création (POST /promotions)** : `menu_id`, `points_required`, `discount`, `quantity_limit`, `start_at`, `end_at` (format `Y-m-d\TH:i`).

---

## Autres

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload-image` | Upload image (auth, throttle 10/min) |
| GET | `/admin/stats` | Stats dashboard admin |
| GET | `/client/stats` | Stats client |
| GET | `/cuisinier/stats` | Stats cuisinier |
| GET | `/livreur/stats` | Stats livreur |
| GET | `/livreur/assignments` | Affectations livraison |
| POST | `/livreur/validate-code` | Valider code livraison |
| GET | `/verificateur/stats` | Stats vérificateur |
| POST | `/verificateur/validate-ticket` | Valider ticket promotion |
| GET | `/entreprise/stats` | Stats entreprise |
| GET | `/subscriptions` | Liste abonnements |
| POST | `/subscriptions` | Créer abonnement |
| GET | `/users` | Liste utilisateurs (admin) |
| POST | `/users/{id}/role` | Changer rôle (admin) |
| POST | `/reports/generate` | Générer rapport |

---

## Codes HTTP

- `200` OK  
- `201` Created  
- `204` No Content  
- `400` Bad Request (ex. points insuffisants, promo expirée)  
- `401` Unauthorized (token manquant ou invalide)  
- `403` Forbidden (rôle insuffisant)  
- `404` Not Found  
- `422` Unprocessable Entity (erreur de validation)  
- `500` Server Error  

Les erreurs de validation (422) renvoient un corps du type :  
`{ "message": "...", "errors": { "champ": ["..."] } }`.
