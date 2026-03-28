# 🚀 Guide de Démarrage Complet - Green Express

## 📋 Prérequis

- PHP 8.2+
- Composer
- Node.js 18+
- npm

---

## ⚙️ Setup Backend (Laravel)

### 1. Configuration environnement

```powershell
cd C:\SERVICE\backend

# Copier le fichier de config recommandée
copy ENV_CONFIG.md .env
# OU copier depuis .env.example et éditer
copy .env.example .env
notepad .env
```

**Variables critiques à vérifier dans `.env` :**
- `APP_KEY` : doit être généré
- `DB_CONNECTION=sqlite` (ou mysql si préférence)
- `JWT_SECRET` : clé pour tokens
- `FRONTEND_URL=http://localhost:3000`

### 2. Installation dépendances

```powershell
cd C:\SERVICE\backend
composer install
```

### 3. Générer clé application

```powershell
php artisan key:generate
```

### 4. Créer base de données

#### Option A : SQLite (recommandé pour dev)
```powershell
# Créer le fichier DB
New-Item -Path database\database.sqlite -ItemType File -Force
```

#### Option B : MySQL
Assurez-vous que MySQL est démarré et créez la DB :
```sql
CREATE DATABASE system_gexpress CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Migrations + Seeders

```powershell
# Migrations + seeders (données de test)
php artisan migrate:fresh --seed

# Vous devriez voir :
# ✅ 6 utilisateurs de test créés
# ✅ Données démo créées
```

### 6. Démarrer serveur backend

```powershell
php artisan serve --port=8000
```

✅ Backend accessible sur : **http://127.0.0.1:8000**

---

## ⚙️ Setup Frontend (Next.js)

### 1. Configuration environnement

```powershell
cd C:\SERVICE\frontend-next

# Créer .env.local
New-Item -Path .env.local -ItemType File -Force
notepad .env.local
```

**Contenu de `.env.local` :**
```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

### 2. Installation dépendances

```powershell
cd C:\SERVICE\frontend-next
npm install
```

### 3. Démarrer serveur frontend

```powershell
npm run dev
```

✅ Frontend accessible sur : **http://localhost:3000**

---

## 🧪 Utilisateurs de Test

| Email | Mot de passe | Rôle | Dashboard |
|-------|-------------|------|-----------|
| `admin@test.com` | `password` | Admin | http://localhost:3000/admin |
| `cuisinier@test.com` | `password` | Cuisinier | http://localhost:3000/cuisinier |
| `client@test.com` | `password` | Client | http://localhost:3000/client |
| `livreur@test.com` | `password` | Livreur | http://localhost:3000/livreur |
| `verificateur@test.com` | `password` | Vérificateur | http://localhost:3000/verificateur |
| `entreprise@test.com` | `password` | Entreprise | http://localhost:3000/entreprise |

---

## 🎯 Commandes Rapides (tout-en-un)

### Setup complet (première fois)

```powershell
# Backend
cd C:\SERVICE\backend
composer install
php artisan key:generate
New-Item -Path database\database.sqlite -ItemType File -Force
php artisan migrate:fresh --seed

# Frontend
cd C:\SERVICE\frontend-next
npm install

# Créer .env.local manuellement avec NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

### Démarrage quotidien

**Terminal 1 (Backend) :**
```powershell
cd C:\SERVICE\backend
php artisan serve --port=8000
```

**Terminal 2 (Frontend) :**
```powershell
cd C:\SERVICE\frontend-next
npm run dev
```

---

## 🔍 Vérifications

### Backend fonctionne ?
```powershell
# Tester route API
curl http://127.0.0.1:8000/api/admin/stats

# Devrait retourner : {"message":"Unauthenticated"} (normal sans token)
```

### Frontend fonctionne ?
Ouvrir : http://localhost:3000

Vous devriez voir la landing page Green Express.

---

## 🐛 Dépannage

### Erreur "Class 'JWTAuth' not found"
```powershell
cd C:\SERVICE\backend
composer dump-autoload
php artisan config:clear
```

### Erreur "database locked" (SQLite)
```powershell
# Fermer tous les terminaux backend
# Supprimer fichier DB et recréer
Remove-Item database\database.sqlite
New-Item -Path database\database.sqlite -ItemType File -Force
php artisan migrate:fresh --seed
```

### Frontend ne trouve pas l'API
Vérifier que `.env.local` existe avec :
```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

### Port 8000 déjà utilisé
```powershell
# Utiliser un autre port
php artisan serve --port=8001

# Modifier frontend .env.local :
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8001/api
```

---

## 📚 Prochaines Étapes

1. ✅ **Tester le flux complet** : voir `TEST_GUIDE.md`
2. 🔐 **Configurer CORS** si problèmes cross-origin
3. 📸 **Configurer upload images** (Cloudinary/Vercel Blob)
4. 💳 **Intégrer paiement** (pawaPay webhook)
5. 🚀 **Déployer** (backend + frontend)

---

## 📞 Support

Pour toute question ou problème :
- Consulter `PHASE2_COMPLETE.md` pour architecture
- Vérifier les logs Laravel : `storage/logs/laravel.log`
- Vérifier console navigateur pour erreurs frontend
