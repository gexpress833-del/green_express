# Exemples Pratiques - Système RBAC

## Table des Matières
1. [Vérifications Backend](#vérifications-backend)
2. [Vérifications Frontend](#vérifications-frontend)
3. [Scénarios Réels](#scénarios-réels)
4. [Pièges Courants](#pièges-courants)

## Vérifications Backend

### Exemple 1: Endpoint Admin Uniquement

```php
// AdminController.php
use App\Http\Traits\RoleAccess;

class AdminController extends Controller {
    use RoleAccess;

    public function deleteUser(Request $request, User $user)
    {
        // Verifier l'utilisateur est admin
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Seuls les administrateurs peuvent supprimer des utilisateurs'
            ], 403);
        }

        $user->delete();
        
        Log::info('User deleted', [
            'admin_id' => $request->user()->id,
            'deleted_user_id' => $user->id
        ]);

        return response()->json(['message' => 'Utilisateur supprimé'], 200);
    }
}
```

### Exemple 2: Accès Propriétaire + Admin

```php
// OrderController.php
public function updateOrder(Request $request, Order $order)
{
    $user = $request->user();

    // Vérifier: propriétaire de la commande OU admin
    if ($user->id !== $order->user_id && $user->role !== 'admin') {
        return response()->json([
            'message' => 'Non autorisé à modifier cette commande'
        ], 403);
    }

    // Mettre à jour
    $order->update($request->validated());
    
    return response()->json($order);
}
```

### Exemple 3: Rôles Multiples

```php
// ReportController.php
public function generateReport(Request $request)
{
    $user = $request->user();
    $allowedRoles = ['admin', 'enterprise'];

    if (!in_array($user->role, $allowedRoles)) {
        return response()->json([
            'message' => 'Accès refusé. Rôles autorisés: ' . implode(', ', $allowedRoles),
            'current_role' => $user->role
        ], 403);
    }

    // Générer le rapport
    return response()->json(['data' => 'report']);
}
```

### Exemple 4: Données Filtrées par Rôle

```php
// MenuController.php
public function index(Request $request)
{
    $user = $request->user();
    $query = Menu::query();

    // Filtrer selon le rôle
    if ($user->role === 'cuisinier') {
        // Cuisinier voir uniquement SES menus
        $query->where('created_by', $user->id);
    } elseif ($user->role === 'client') {
        // Client voir uniquement les menus APPROUVÉS
        $query->where('status', 'approved');
    }
    // Admin voit tout

    return response()->json($query->paginate());
}
```

### Exemple 5: Vérification de Permission Spécifique

```php
// PromotionController.php
public function approvePromotion(Request $request, Promotion $promotion)
{
    $user = $request->user();
    $config = config('roles');
    $rolePerms = $config['roles'][$user->role]['permissions'] ?? [];

    if (!in_array('promotions.approve', $rolePerms)) {
        return response()->json([
            'message' => 'Permission requise: promotions.approve'
        ], 403);
    }

    $promotion->update(['status' => 'approved']);
    return response()->json($promotion);
}
```

### Exemple 6: Logging de Sécurité

```php
// UserController.php
public function assignRole(Request $request, User $user)
{
    $admin = $request->user();

    if ($admin->role !== 'admin') {
        // Log les tentatives non autorisées
        Log::warning('Unauthorized role assignment attempt', [
            'user_id' => $admin->id,
            'target_user_id' => $user->id,
            'role' => $admin->role
        ]);
        
        return response()->json(['message' => 'Non autorisé'], 403);
    }

    $oldRole = $user->role;
    $user->role = $request->input('role');
    $user->save();

    // Log l'action réussie
    Log::info('Role assignment', [
        'admin_id' => $admin->id,
        'user_id' => $user->id,
        'old_role' => $oldRole,
        'new_role' => $user->role
    ]);

    return response()->json($user);
}
```

## Vérifications Frontend

### Exemple 1: Afficher Contenu Admin Uniquement

```jsx
// AdminPanel.jsx
import RoleGuard from '@/components/RoleGuard'

export default function AdminPanel() {
  return (
    <RoleGuard allowedRoles="admin" fallback={<p>Accès non autorisé</p>}>
      <div className="admin-panel">
        <h1>Panneau d'Administration</h1>
        {/* Contenu admin */}
      </div>
    </RoleGuard>
  )
}
```

### Exemple 2: Boutons Conditionnels

```jsx
// UserManagement.jsx
import { canPerform } from '@/lib/permissions'

export default function UserManagement({ user }) {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>Rôle: {user.role}</p>
      
      {canPerform('users.edit') && (
        <button className="btn-edit">Éditer</button>
      )}
      
      {canPerform('users.delete') && (
        <button className="btn-delete">Supprimer</button>
      )}
    </div>
  )
}
```

### Exemple 3: Redirection par Rôle

```jsx
// Dashboard.jsx
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { canAccess } from '@/lib/permissions'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const userData = userStr ? JSON.parse(userStr) : null

    setUser(userData)

    // Rediriger vers le bon dashboard selon le rôle
    if (userData && userData.role === 'client') {
      router.push('/client')
    } else if (userData && userData.role === 'cuisinier') {
      router.push('/cuisinier')
    } else if (userData && userData.role === 'admin') {
      router.push('/admin')
    }
  }, [router])

  // Afficher selon le rôle
  if (canAccess('admin')) {
    return <AdminDashboard user={user} />
  } else if (canAccess('cuisinier')) {
    return <ChefDashboard user={user} />
  } else if (canAccess('client')) {
    return <ClientDashboard user={user} />
  }

  return <p>Chargement...</p>
}
```

### Exemple 4: Menu de Navigation Dynamique

```jsx
// Navbar.jsx
import { canAccess, hasRole } from '@/lib/permissions'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">GreenExpress</div>
      
      <ul className="nav-links">
        <li><Link href="/">Accueil</Link></li>

        {/* Admin */}
        {hasRole('admin') && (
          <>
            <li><Link href="/admin">Dashboard Admin</Link></li>
            <li><Link href="/admin/users">Utilisateurs</Link></li>
            <li><Link href="/admin/menus">Menus</Link></li>
          </>
        )}

        {/* Cuisinier */}
        {hasRole('cuisinier') && (
          <>
            <li><Link href="/cuisinier">Mes Menus</Link></li>
            <li><Link href="/cuisinier/menu/create">Créer Menu</Link></li>
          </>
        )}

        {/* Client */}
        {hasRole('client') && (
          <>
            <li><Link href="/client/menus">Commander</Link></li>
            <li><Link href="/client/orders">Mes Commandes</Link></li>
            <li><Link href="/client/promotions">Promotions</Link></li>
          </>
        )}

        {/* Livreur */}
        {hasRole('livreur') && (
          <>
            <li><Link href="/livreur/assignments">Livraisons</Link></li>
            <li><Link href="/livreur/performance">Performance</Link></li>
          </>
        )}
      </ul>
    </nav>
  )
}
```

### Exemple 5: Tableau Interactif avec Actions Conditionnelles

```jsx
// MenusList.jsx
import RoleGuard from '@/components/RoleGuard'
import { canPerform, isOwnerOrAdmin } from '@/lib/permissions'

export default function MenusList({ menus, currentUser }) {
  return (
    <table className="menus-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Chef</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {menus.map(menu => (
          <tr key={menu.id}>
            <td>{menu.title}</td>
            <td>{menu.creator.name}</td>
            <td>{menu.status}</td>
            <td>
              {/* Modifier: propriétaire ou admin */}
              {isOwnerOrAdmin(menu.created_by, currentUser) && (
                <button>Modifier</button>
              )}

              {/* Approuver: admin uniquement */}
              <RoleGuard allowedRoles="admin">
                <button>Approuver</button>
              </RoleGuard>

              {/* Supprimer: propriétaire ou admin */}
              {(canPerform('menus.delete') || isOwnerOrAdmin(menu.created_by, currentUser)) && (
                <button>Supprimer</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Scénarios Réels

### Scénario 1: Cuisinier crée un menu

```javascript
// Frontend: Vérifier que c'est un cuisinier
if (!canPerform('menus.create')) {
  showError('Seuls les cuisiniers peuvent créer des menus')
  return
}

// Frontend: Envoyer la requête
const response = await apiRequest('/api/menus', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Menu de Semaine',
    description: '...',
    price: 15.99
  })
})

// Backend: MenuController.store()
public function store(StoreMenuRequest $request) {
  $user = $request->user()
  
  // Vérifier: cuisinier ou admin
  if ($user->role !== 'cuisinier' && $user->role !== 'admin') {
    return response()->json(['message' => 'Non autorisé'], 403)
  }
  
  // Créer le menu
  $menu = Menu::create([..., 'created_by' => $user->id])
  
  return response()->json($menu, 201)
}
```

### Scénario 2: Client commande mais voit une erreur 403

```javascript
// Frontend: Client clique sur "Créer une commande"
// RoleGuard affiche le bouton car client a la permission

// Frontend: Envoyer la requête
const response = await apiRequest('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    menu_id: 5,
    quantity: 2
  })
}) // Error 403: Non authentifié

// Raison: Le token a expiré dans localStorage
// Solution: Rediriger vers /login et laisser l'utilisateur se reconnecter
```

### Scénario 3: Admin modifie le rôle d'un utilisateur

```javascript
// Frontend: Admin sélectionne un utilisateur et change son rôle
const response = await apiRequest('/api/users/42/role', {
  method: 'POST',
  body: JSON.stringify({ role: 'cuisinier' })
})

// Backend: UserController.updateRole()
if ($admin->role !== 'admin') {
  Log::warning('Unauthorized role change attempt', [...])
  abrt 403
}

// Change le rôle et log l'action
$user->role = 'cuisinier'
$user->save()

Log::info('Role changed', [
  'admin_id' => $admin->id,
  'user_id' => $user->id,
  'new_role' => 'cuisinier'
])
```

## Pièges Courants

### ❌ Piège 1: Oublier de vérifier côté backend

```php
// MAUVAIS - Vérifie uniquement au frontend
// ClientComponent.jsx
{canPerform('users.create') && <button>Créer</button>}

// Un attaquant peut directement appeler POST /api/users
// et créer un utilisateur non autorisé !
```

**Solution:** Toujours vérifier au backend

```php
// BON - Vérifier dans le contrôleur
public function store(Request $request) {
  if ($request->user()->role !== 'admin') {
    return response()->json(['message' => 'Non autorisé'], 403)
  }
  // ... créer l'utilisateur
}
```

### ❌ Piège 2: Faire confiance au localStorage pour les données sensibles

```javascript
// MAUVAIS
const user = JSON.parse(localStorage.getItem('user'))
if (user.role === 'admin') {
  // Afficher données sensibles
}

// Le localStorage est facile à modifier avec DevTools!
// Un attaquant peut changer son rôle directement
```

**Solution:** Vérifier le rôle du token JWT au backend

```php
// BON
$user = $request->user() // Provient du JWT signé
if ($user->role === 'admin') {
  // Données sensibles
}

// Le JWT est signé, on ne peut pas le modifier
```

### ❌ Piège 3: Oublier la redirection après vérification échouée

```jsx
// MAUVAIS
export default function AdminPage() {
  const user = JSON.parse(localStorage.getItem('user'))
  
  if (user.role !== 'admin') {
    // Oups, on n'a rien fait
    // L'utilisateur voit quand même la page !
  }

  return <AdminContent />
}
```

**Solution:** Rediriger

```jsx
// BON
export default function AdminPage() {
  const router = useRouter()
  
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    
    if (!user || user.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }, [router])

  return <AdminContent />
}
```

### ❌ Piège 4: Retourner trop d'informations en cas d'erreur

```php
// MAUVAIS
if ($user->role !== 'admin') {
  return response()->json([
    'message' => 'Vous n\'êtes pas en admin',
    'required_role' => 'admin',
    'your_role' => $user->role,
    'api_endpoints' => [...], // SENSIBLE !
    'error_code' => 'UNAUTHORIZED_ADMIN_ACCESS' // dévoile la structure
  ], 403)
}
```

**Solution:** Retourner des messages génériques

```php
// BON
if ($user->role !== 'admin') {
  return response()->json([
    'message' => 'Accès refusé',
    // En production: pas de détails sensibles
  ], 403)
}
```

### ❌ Piège 5: Vérifier le rôle mais pas les données

```php
// MAUVAIS
public function updateMenu(Request $request, Menu $menu) {
  // Vérifie que c'est un cuisinier
  if ($request->user()->role !== 'cuisinier') {
    abort(403)
  }

  // Mais ne vérifie pas que C'EST SON MENU !
  $menu->update($request->validated())
  return $menu
}

// Un cuisinier peut modifier les menus d'autres cuisiniers !
```

**Solution:** Vérifier à la fois le rôle ET la propriété

```php
// BON
public function updateMenu(Request $request, Menu $menu) {
  $user = $request->user()
  
  if ($user->role !== 'cuisinier' && $user->role !== 'admin') {
    abort(403)
  }

  // ET vérifier que c'est son menu (ou admin)
  if ($user->role === 'cuisinier' && $menu->created_by !== $user->id) {
    abort(403)
  }

  $menu->update($request->validated())
  return $menu
}
```

---

## Ressources Supplémentaires

- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - Guide complet
- [config/roles.php](./backend/config/roles.php) - Configuration
- [RoleAccess.php](./backend/app/Http/Traits/RoleAccess.php) - Trait backend
- [RoleGuard.jsx](./frontend-next/app/components/RoleGuard.jsx) - Composant frontend
- [permissions.js](./frontend-next/app/lib/permissions.js) - Utilitaires frontend

