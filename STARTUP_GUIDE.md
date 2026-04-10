# 🚀 Guide de Démarrage - Backend & Frontend

## Étape 1: Lancer le Backend (Laravel)

### A. Initialiser la base de données

```powershell
# Naviguer vers le dossier backend
cd C:\SERVICE\backend

# Créer la base de données SQLite si elle n'existe pas
php artisan migrate:fresh --seed
```

Cela va:
- ✅ Créer le fichier `database.sqlite`
- ✅ Exécuter les migrations
- ✅ Importer les données de test (seeders)

### B. Lancer le serveur Laravel

```powershell
# En PowerShell ou CMD, dans C:\SERVICE\backend
php artisan serve
```

Attendez que vous voyez:
```
Laravel development server started on [http://127.0.0.1:8000]
```

✅ Le backend tourne maintenant sur `http://127.0.0.1:8000`

---

## Étape 2: Lancer le Frontend (Next.js)

### Dans un nouvel terminal PowerShell

```powershell
# Naviguer vers le frontend
cd C:\SERVICE\frontend-next

# Lancer le serveur Next.js
npm run dev
```

Attendez que vous voyez:
```
  ▲ Next.js
  ▶ Local: http://localhost:3000
```

✅ Le frontend tourne maintenant sur `http://localhost:3000`

---

## Étape 3: Tester les Boutons

1. Ouvrez `http://localhost:3000` dans votre navigateur
2. Vous devez voir les boutons **"Se connecter"** et **"S'inscrire"** en haut à droite
3. Cliquez sur **"Se connecter"**
4. Vous devriez être redirigé vers `http://localhost:3000/login`
5. Entrez les identifiants de test:
   - Email: `admin@test.com`
   - Password: `password`
6. Cliquez sur "Se connecter"
7. Vous devriez être redirigé vers `/admin` ✅

---

## Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@test.com` | `password` |
| Cuisinier | `cuisinier@test.com` | `password` |
| Client | `client@test.com` | `password` |
| Livreur | `livreur@test.com` | `password` |
| Vérificateur | `verificateur@test.com` | `password` |
| Entreprise | `entreprise@test.com` | `password` |

---

## Dépannage

### Erreur: "Unauthenticated"
- Vérifiez que le backend est lancé sur `http://127.0.0.1:8000`
- Essayez: `curl http://127.0.0.1:8000/api/login` dans un terminal

### Les boutons "Se connecter" / "S'inscrire" ne s'affichent pas
- Le problème était que le `loading` restait `true`
- **J'ai corrigé cela** - les boutons s'affichent maintenant même pendant le chargement
- Videz le cache du navigateur (Ctrl+Shift+Delete) et rafraîchissez (Ctrl+R)

### La page login / register affiche une erreur
- Vérifiez la console navigateur (F12 → Console)
- Cherchez des erreurs disant "Cannot reach API"
- Si oui, c'est que le backend n'est pas lancé

### "Database file not found"
- Lancez: `php artisan migrate:fresh --seed`
- Cela va créer le fichier `database/database.sqlite`

---

## Fichiers Importants

- **Frontend**: `/frontend-next/app/components/Navbar.jsx` (boutons de navigation)
- **Frontend**: `/frontend-next/app/login/page.jsx` (formulaire login)
- **Frontend**: `/frontend-next/app/register/page.jsx` (formulaire register)
- **Backend**: `/backend/routes/api.php` (routes API)
- **Backend**: `/backend/app/Http/Controllers/AuthController.php` (logique auth)

---

## Corrections Appliquées

1. ✅ **Timeout ajouté** à la Navbar (5 secondes max)
   - Les boutons s'affichent maintenant même si l'API est lente

2. ✅ **CSS amélioré**
   - `cursor: pointer` explicite
   - `pointer-events: auto` pour assurer la cliquabilité

3. ✅ **Fallback dans la Navbar**
   - Les boutons s'affichent même pendant `loading`

---

## Prochaines Étapes

Une fois que les boutons fonctionnent:
1. ✅ Testez la création de menu (Admin)
2. ✅ Testez la création de plat (Cuisinier)
3. ✅ Testez l'approbation de menu (Admin → approuver les plats)

---

**Status**: 🟢 Les boutons devraient maintenant fonctionnaliser complètement!
