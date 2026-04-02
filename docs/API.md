# Green Express – Référence API

Base URL : `http://127.0.0.1:8000/api` en local, ou l’URL de déploiement Render.

Authentification principale : **session / cookies Laravel** via `auth:api` (SPA Next.js + Sanctum/session).  
Selon les cas, certains clients externes peuvent aussi utiliser un header `Authorization`, mais la référence projet actuelle côté frontend repose sur les cookies de session.

Une spécification OpenAPI minimale est disponible dans [openapi.yaml](openapi.yaml).

---

## Auth

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Créer un compte |
| POST | `/login` | Ouvrir une session |
| GET | `/me` | Utilisateur courant |
| POST | `/logout` | Fermer la session |

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
| POST | `/orders/{id}/initiate-payment` | Initier un paiement Mobile Money via pawaPay |
| POST | `/orders/{uuid}/validate-code` | Valider code livraison |

**Création (POST /orders)** : `items` (array de `{menu_id, quantity, price?}`), `delivery_address`, `company_id?`.

**Paiement commande (POST /orders/{id}/initiate-payment)** :
- `client_phone_number`
- `country_code` : `DRC` uniquement (FlexPay)
- `provider` optionnel (informationnel côté front)

Le backend appelle l’API FlexPay, stocke un `Payment` avec `provider = flexpay`, puis attend le callback ou le job de secours (`CheckPendingPaymentsJob`).

### Webhook FlexPay

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/flexpay/callback` | Notification FlexPay (transaction confirmée ou échouée) |

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
| POST | `/subscriptions/{id}/initiate-payment` | Initier paiement d’abonnement via pawaPay |
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
