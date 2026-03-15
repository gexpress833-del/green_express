# 🚀 Démarrer les Tests - Guide Rapide

## ✅ Prérequis Vérifiés
- [x] Base de données créée et seedée (6 users + données démo)
- [x] Configuration .env backend OK
- [x] Configuration .env.local frontend créée

---

## 🎬 Étape 1 : Démarrer les Serveurs

### Terminal 1 - Backend Laravel
```powershell
cd C:\SERVICE\backend
php artisan serve --port=8000
```

**Attendu :**
```
Starting Laravel development server: http://127.0.0.1:8000
```

✅ **Ne fermez pas ce terminal** - Il doit rester ouvert

---

### Terminal 2 - Frontend Next.js
```powershell
cd C:\SERVICE\frontend-next
npm run dev
```

**Attendu :**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ **Ne fermez pas ce terminal** - Il doit rester ouvert

---

## 🧪 Étape 2 : Premier Test (Admin)

### 1. Ouvrir le navigateur
```
http://localhost:3000
```

### 2. Cliquer "Se connecter"

### 3. Utiliser compte Admin
```
Email    : admin@test.com
Password : password
```

### 4. Vérifier la redirection
```
✅ Doit rediriger vers : http://localhost:3000/admin
✅ Doit afficher le dashboard avec statistiques
✅ Navbar doit afficher "Tableau de bord"
```

---

## 👥 Étape 3 : Tester Tous les Rôles

### Comptes de Test Disponibles

| Rôle | Email | Password | Page Dashboard |
|------|-------|----------|----------------|
| 👨‍💼 Admin | `admin@test.com` | `password` | `/admin` |
| 🧑‍🍳 Cuisinier | `cuisinier@test.com` | `password` | `/cuisinier` |
| 👤 Client | `client@test.com` | `password` | `/client` |
| 🚚 Livreur | `livreur@test.com` | `password` | `/livreur` |
| ✅ Vérificateur | `verificateur@test.com` | `password` | `/verificateur` |
| 🏢 Entreprise | `entreprise@test.com` | `password` | `/entreprise` |

### Procédure pour Chaque Rôle
```
1. Se déconnecter (si déjà connecté)
2. Se reconnecter avec nouveau compte
3. Vérifier redirection vers bonne page
4. Vérifier que statistiques s'affichent
5. Tester navigation sidebar
```

---

## 🎯 Étape 4 : Tests Fonctionnels

### Test A : Admin Valide un Menu

**Compte** : `admin@test.com`

1. Aller sur `/admin/menus`
2. Tu devrais voir 5 menus dont 1 "pending"
3. Trouver menu "Pizza Margherita" (status: pending)
4. Cliquer "Approuver" *(fonctionnalité à implémenter)*

**Résultat attendu** : Status passe de "pending" à "approved"

---

### Test B : Cuisinier Crée un Menu

**Compte** : `cuisinier@test.com`

1. Aller sur `/cuisinier`
2. Cliquer "Créer un menu"
3. Remplir formulaire :
   - Titre : "Test Menu"
   - Description : "Menu de test"
   - Prix : 10.00
   - Devise : USD
4. Soumettre

**Résultat attendu** : 
- Menu créé avec status "pending"
- Visible dans `/admin/menus` pour validation

---

### Test C : Client Voit ses Stats

**Compte** : `client@test.com`

1. Aller sur `/client`
2. Vérifier dashboard affiche :
   - Points : 120
   - Commandes : 2
   - Abonnements : 1

**Résultat attendu** : Stats correctes basées sur les seeders

---

### Test D : API Backend

**Ouvrir un nouveau terminal** :

```powershell
# Test 1 : Login
$body = @{
    email = "admin@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
Write-Host "Token: $($response.token)"
Write-Host "User: $($response.user.name) - Role: $($response.user.role)"
```

**Résultat attendu** :
```
Token: eyJ0eXAiOiJKV1QiLCJhbGc...
User: Admin Principal - Role: admin
```

```powershell
# Test 2 : Stats Admin
$token = $response.token
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/admin/stats" -Headers $headers
```

**Résultat attendu** :
```json
{
  "orders": 2,
  "revenue": ...,
  "revenue_currency": "USD",
  "subscriptions": 1
}
```

---

## ✅ Checklist de Validation

### Frontend
- [ ] Landing page s'affiche (localhost:3000)
- [ ] Login fonctionne pour tous les rôles
- [ ] Redirection correcte selon rôle après login
- [ ] Dashboard affiche stats pour chaque rôle
- [ ] Navbar "Tableau de bord" pointe vers bon rôle
- [ ] Logout fonctionne et redirige vers "/"
- [ ] Sidebar navigation fonctionne
- [ ] Pas d'erreurs console navigateur (F12)

### Backend
- [ ] Serveur démarre sur :8000
- [ ] Route login retourne JWT
- [ ] Route /me retourne user avec rôle
- [ ] Routes stats retournent données
- [ ] Pas d'erreurs dans terminal backend

### Base de Données
- [ ] 6 utilisateurs créés
- [ ] 5 menus présents
- [ ] 2 commandes présentes
- [ ] Points client = 120

---

## 🐛 Problèmes Fréquents

### "Connection refused" sur API
```
→ Backend pas démarré
→ Solution : Vérifier terminal 1 (php artisan serve)
```

### "Unauthenticated" après login
```
→ JWT mal configuré
→ Solution : Vérifier backend/.env contient JWT_SECRET
```

### Page blanche après login
```
→ Erreur JavaScript
→ Solution : Ouvrir console (F12) et lire l'erreur
```

### Stats affichent "—"
```
→ API ne répond pas
→ Solution : Vérifier que backend tourne sur :8000
→ Vérifier console navigateur pour erreurs CORS
```

---

## 📱 Ordre de Test Recommandé

```
1️⃣ Admin (tout voir, tout gérer)
   → Valider que données démo existent
   → Tester navigation complète

2️⃣ Cuisinier (créer menu)
   → Tester création menu
   → Vérifier apparaît dans admin

3️⃣ Client (voir menus)
   → Vérifier stats
   → Tester navigation pages

4️⃣ Livreur (voir missions)
   → Vérifier dashboard
   → Tester navigation

5️⃣ Vérificateur (validation)
   → Vérifier stats
   → Interface validation visible

6️⃣ Entreprise (rapports)
   → Vérifier dashboard
   → Tester navigation rapports
```

---

## 🎉 Si Tout Fonctionne

**Félicitations !** Tu as un système complet qui fonctionne :
- ✅ 6 rôles opérationnels
- ✅ Auth JWT fonctionnel
- ✅ Navigation dynamique par rôle
- ✅ API backend robuste
- ✅ Données de test cohérentes

**Prochaines étapes** :
1. Implémenter logique métier (validation menus, paiements, etc.)
2. Ajouter upload images
3. Intégrer webhook paiement
4. Déployer en production

---

**Bon test ! 🚀**
