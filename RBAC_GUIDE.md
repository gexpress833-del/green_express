# Guide du Système de Contrôle d'Accès Basé sur les Rôles (RBAC)

## Vue d'ensemble

Le système est conçu pour s'assurer que chaque utilisateur respecte les limites de son rôle et ne peut effectuer que les actions autorisées.

## Rôles et Permissions

### 1. **Admin** 🔐
- **Accès**: Panneau d'admin complet
- **Permissions**:
  - Gestion des utilisateurs (créer, modifier, assigner rôles)
  - Gestion des menus (créer, modifier, approuver, supprimer)
  - Visualisation des statistiques complètes
  - Gestion des commandes
  - Accès à tous les endpoints

### 2. **Cuisinier** 👨‍🍳
- **Accès**: Panneau `Tableau de bord Cuisinier`
- **Permissions Spécifiques**:
  - Créer ses propres menus (statut "pending" par défaut)
  - Modifier/supprimer UNIQUEMENT ses propres menus
  - Voir les commandes associées à ses menus
  - Consulter ses statistiques personnelles
- **Restrictions**: 
  - ❌ Ne peut pas voir les menus d'autres cuisiniers
  - ❌ Ne peut pas approuver ses propres menus
  - ❌ Ne peut pas accéder au panneau admin

### 3. **Client** 👤
- **Accès**: Panneau `Tableau de bord Client`
- **Permissions Spécifiques**:
  - Voir les menus approuvés uniquement
  - Créer des commandes
  - Voir ses propres commandes
  - Annuler ses propres commandes
  - Réclamer des promotions
  - Gérer ses abonnements
  - Consulter ses points de fidélité
- **Restrictions**:
  - ❌ Ne peut pas voir les menus en attente
  - ❌ Ne peut pas voir les commandes d'autres clients
  - ❌ Ne peut pas annuler les commandes livrées

### 4. **Livreur** 🚚
- **Accès**: Panneau `Tableau de bord Livreur`
- **Permissions Spécifiques**:
  - Voir ses livraisons assignées
  - Valider le code de livraison
  - Mettre à jour le statut de livraison
  - Consulter sa performance
- **Restrictions**:
  - ❌ Ne peut pas modifier les commandes
  - ❌ Ne peut pas créer des commandes
  - ❌ Ne peut pas voir les commandes d'autres livreurs

### 5. **Vérificateur** ✅
- **Accès**: Panneau `Tableau de bord Vérificateur`
- **Permissions Spécifiques**:
  - Valider les tickets de promotion
  - Voir les tickets en attente
  - Consulter l'historique de validation
- **Restrictions**:
  - ❌ Ne peut pas créer de promotions
  - ❌ Ne peut pas modifier les tickets

### 6. **Entreprise** 🏢
- **Accès**: Panneau `Tableau de bord Entreprise`
- **Permissions Spécifiques**:
  - Gérer ses employés
  - Voir ses commandes
  - Gérer ses abonnements
  - Consulter son budget
- **Restrictions**:
  - ❌ Ne peut pas voir les employés d'autres entreprises
  - ❌ Ne peut pas modifier les commandes directement

## Implémentation Backend

### Configuration Centralisée
Fichier: `backend/config/roles.php`

Définit les rôles et permissions standardisées.

### Trait RoleAccess
Fichier: `backend/app/Http/Traits/RoleAccess.php`

Fournit des méthodes helper pour vérifier les rôles:

```php
// Vérifier un rôle spécifique
$error = $this->requireRole($request, 'admin');
if ($error) return $error;

// Vérifier une permission
$error = $this->requirePermission($request, 'users.create');
if ($error) return $error;

// Vérifier propriétaire ou admin
$error = $this->requireOwnerOrAdmin($request, $userId);
if ($error) return $error;

// Obtenir les permissions de l'utilisateur
$permissions = $this->getUserPermissions($request);
```

### Utilisation dans les Contrôleurs

**Exemple 1: Vérifier le rôle Admin**
```php
public function stats(Request $request)
{
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Non authentifié'], 401);
    }

    if ($user->role !== 'admin') {
        return response()->json([
            'message' => 'Accès refusé. Rôle admin requis',
            'current_role' => $user->role
        ], 403);
    }

    // ... logique admin
}
```

**Exemple 2: Vérifier propriétaire ou admin**
```php
public function update(Request $request, Menu $menu)
{
    $user = $request->user();
    
    if ($user->role !== 'admin' && (int)$menu->created_by !== (int)$user->id) {
        return response()->json([
            'message' => 'Non autorisé à modifier ce menu'
        ], 403);
    }
    
    // ... logique de modification
}
```

### Endpoints Protégés

| Endpoint | Rôles Autorisés | Description |
|----------|-----------------|-------------|
| `GET /api/users` | Admin | Lister tous les utilisateurs |
| `POST /api/users` | Admin | Créer un utilisateur |
| `POST /api/users/{id}/role` | Admin | Modifier le rôle |
| `GET /api/menus` | All | Lister les menus (filtrés par rôle) |
| `POST /api/menus` | Cuisinier, Admin | Créer un menu |
| `PUT /api/menus/{id}` | Cuisinier (own), Admin | Modifier un menu |
| `DELETE /api/menus/{id}` | Cuisinier (own), Admin | Supprimer un menu |
| `POST /api/orders` | Client, Admin | Créer une commande |
| `GET /api/admin/stats` | Admin | Stats admin |
| `GET /api/client/stats` | Client, Admin | Stats client |
| `GET /api/cuisinier/stats` | Cuisinier, Admin | Stats cuisinier |

## Implémentation Frontend

### Composant RoleGuard
Fichier: `frontend-next/app/components/RoleGuard.jsx`

Affiche/masque du contenu selon le rôle:

```jsx
import RoleGuard from '@/components/RoleGuard'

// Exemple 1: Afficher uniquement pour admin
<RoleGuard allowedRoles="admin">
  <button>Gérer les utilisateurs</button>
</RoleGuard>

// Exemple 2: Afficher pour plusieurs rôles
<RoleGuard allowedRoles={['admin', 'cuisinier']}>
  <button>Créer un menu</button>
</RoleGuard>

// Exemple 3: Avec fallback
<RoleGuard 
  allowedRoles="client" 
  fallback={<p>Action non disponible</p>}
>
  <button>Commander</button>
</RoleGuard>

// Exemple 4: Afficher un avertissement
<RoleGuard 
  allowedRoles="verificateur" 
  showWarning={true}
>
  <button>Valider un ticket</button>
</RoleGuard>
```

### Utilitaire de Permissions
Fichier: `frontend-next/app/lib/permissions.js`

```jsx
import { canAccess, canPerform, hasRole } from '@/lib/permissions'

// Vérifier si utilisateur a accès
if (canAccess('admin')) {
  // Afficher panneau admin
}

// Vérifier une permission
if (canPerform('users.create')) {
  // Afficher bouton créer utilisateur
}

// Vérifie le rôle exact
if (hasRole('client')) {
  // Afficher contenu client
}

// Est propriétaire ou admin?
if (isOwnerOrAdmin(userId)) {
  // Afficher bouton modifier
}
```

### Exemple d'Integration dans une Page

```jsx
"use client"
import { useRouter } from 'next/navigation'
import RoleGuard from '@/components/RoleGuard'
import { canAccess } from '@/lib/permissions'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1. Vérification d'authentification (déjà dans le layout)
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 2. Vérification du rôle
    const userStr = localStorage.getItem('user')
    const userData = userStr ? JSON.parse(userStr) : null
    
    if (!userData || userData.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
    
    setUser(userData)
  }, [router])

  if (!user) return <div>Chargement...</div>

  return (
    <RoleGuard allowedRoles="admin">
      <div>
        <h1>Panneau d'Administration</h1>
        
        {/* Section visible uniquement pour admin */}
        <RoleGuard allowedRoles="admin">
          <section className="admin-section">
            <h2>Gestion des utilisateurs</h2>
            <button>Créer un utilisateur</button>
          </section>
        </RoleGuard>
      </div>
    </RoleGuard>
  )
}
```

## Flux d'Authentification et Autorisation

```
1. Utilisateur se connecte
   ↓
2. Reçoit token JWT avec 'role' dans les custom claims
   ↓
3. Token stocké dans localStorage
   ↓
4. Frontend charge dans localStorage aussi: { id, name, email, role }
   ↓
5. À chaque navigation:
   - Vérifier token existant → redirect /login si absent
   - Vérifier rôle autorisé → redirect /unauthorized si non autorisé
   ↓
6. À chaque appel API:
   - Backend reçoit token dans Authorization header
   - Valide token et récupère le rôle de l'utilisateur
   - Vérifie roleendpoint + permissions spécifiques
   - Retourne 401 si non authentifié, 403 si non autorisé
```

## Logs de Sécurité

Tous les contrôleurs enregistrent les actions importantes:

```php
Log::info('Action importante', [
    'user_id' => $user->id,
    'action' => 'creation/modification/suppression',
    'resource_id' => $resourceId,
    'role' => $user->role
]);
```

Consultez `storage/logs/laravel.log` pour auditer.

## Tests de Vérification

### Backend
```bash
# Test: Admin peut créer un utilisateur
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","role":"client"}'

# Test: Client NE peut PAS créer un utilisateur (403)
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  ...

# Test: Livreur peut voir ses stats
curl -X GET http://localhost:8000/api/livreur/stats \
  -H "Authorization: Bearer $LIVREUR_TOKEN"

# Test: Livreur NE peut PAS voir les stats admin (403)
curl -X GET http://localhost:8000/api/admin/stats \
  -H "Authorization: Bearer $LIVREUR_TOKEN"
```

### Frontend
1. Connectez-vous avec un compte client
2. Naviguez vers `/admin` → doit rediriger vers `/login`
3. Connectez-vous avec un admin
4. Navigez vers `/admin` → doit afficher le panneau
5. Naviguez vers `/cuisinier` → doit rediriger vers `/client` (ou page d'accueil)

## Checklist de Sécurité

- ✅ Tous les endpoints protégés vérifient l'authentification
- ✅ Les endpoints critiques vérifient le rôle approprié
- ✅ Les données sont filtrées selon le rôles (ex: cuisinier voit uniquement ses menus)
- ✅ Les modifications sont restreintes au propriétaire ou admin
- ✅ Frontend redirige les utilisateurs non autorisés
- ✅ Les logs enregistrent toutes les actions importantes
- ✅ Les messages d'erreur ne révèlent pas d'informations sensibles (en production)

## Dépannage

**Problème**: Utilisateur ne peut pas accéder à son tableau de bord
- Vérifier que le token est stocké dans localStorage
- Vérifier que le rôle est correctement assigné (voir /api/me)
- Vérifier que la page a un useEffect qui vérifie le token

**Problème**: Erreur 403 "Accès refusé"
- Vérifier que le rôle de l'utilisateur est correct
- Consulter le fichier config/roles.php pour voir les permissions requises
- Consultez les logs pour l'audit

**Problème**: Erreur 401 "Non authentifié"
- Vérifier que le token JWT est valide
- Vérifier que le token n'a pas expiré
- Essayer de se reconnecter

