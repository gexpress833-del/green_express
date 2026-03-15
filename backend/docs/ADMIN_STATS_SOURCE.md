# Source des données — Tableau de bord Admin

## Authenticité des données

Les indicateurs affichés sur le tableau de bord admin (`/admin`) proviennent **directement de la base de données** via l’API Laravel. Aucune donnée n’est simulée ou en dur.

## Endpoints utilisés

| Donnée affichée   | Endpoint API           | Source backend (Controller / Modèle) |
|-------------------|------------------------|--------------------------------------|
| Commandes, Revenus, Abonnements, Menus, etc. | `GET /api/admin/stats` | `AdminController::stats()` → modèles Eloquent |
| Menus récents     | `GET /api/menus?recent=1` | `MenuController::index()` → `Menu::with('creator')` |

## Calcul côté backend (`AdminController::stats`)

- **Commandes** : `Order::count()`
- **Revenus** : `Order::sum('total_amount')` (somme des totaux des commandes enregistrées)
- **Abonnements** : `Subscription::count()`
- **Menus** : `Menu::count()` et `Menu::where('status', 'pending')->count()` pour les en attente
- **Entreprises B2B** : `Company::count()` et `Company::where('status', 'pending')->count()`
- **Abonnements B2B** : `CompanySubscription::count()` et idem en `pending`
- **Livraisons en attente** : `DeliveryLog::where('status', 'pending')->count()`

L’accès à `GET /api/admin/stats` est réservé aux utilisateurs ayant le rôle `admin` (vérification dans le contrôleur). En cas d’échec de connexion à la base, l’API renvoie une erreur 500 et le frontend affiche un message d’erreur.

## Devise des revenus

Le backend renvoie actuellement `revenue_currency: 'USD'`. L’affichage en FC (CDF) sur le tableau de bord est géré côté frontend pour cohérence avec l’usage métier (RDC). Les montants stockés en base restent inchangés ; seule la présentation peut être en CDF/FC.
