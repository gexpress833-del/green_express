# 🧪 Guide de Test par Rôle - Green Express

Ce guide vous permet de tester manuellement toutes les fonctionnalités par rôle utilisateur.

---

## 🎯 Scénarios de Test

### ✅ Test 1 : Admin

**Connexion :**
- URL : http://localhost:3000/login
- Email : `admin@test.com`
- Password : `password`

**Après connexion :**
- ✅ Redirection automatique vers `/admin`
- ✅ Dashboard affiche statistiques :
  - Commandes : 2
  - Revenus : variable
  - Abonnements : 1
- ✅ Tableau "Menus récents" visible

**Actions à tester :**
1. Navbar → "Tableau de bord" pointe vers `/admin` ✅
2. Sidebar → "Menus" → liste des menus (5 items) ✅
3. Sidebar → "Promotions" → liste des promos (2 items) ✅
4. Sidebar → "Utilisateurs" → liste 6 users ✅
5. Sidebar → "Paiements" → page vide (normal) ✅
6. Se déconnecter → retour landing page ✅

---

### ✅ Test 2 : Cuisinier

**Connexion :**
- Email : `cuisinier@test.com`
- Password : `password`

**Après connexion :**
- ✅ Redirection automatique vers `/cuisinier`
- ✅ Dashboard affiche statistiques :
  - Menus : 5
  - Soumis : 1 (pending)
  - Validés : 4 (approved)

**Actions à tester :**
1. Clic "Créer un menu" → formulaire création ✅
2. Navbar → "Tableau de bord" pointe vers `/cuisinier` ✅
3. Tester création menu :
   - Titre : "Nouveau plat test"
   - Prix : 15.00
   - Devise : USD
   - Submit → vérifier dans DB ou liste menus ✅

---

### ✅ Test 3 : Client

**Connexion :**
- Email : `client@test.com`
- Password : `password`

**Après connexion :**
- ✅ Redirection automatique vers `/client`
- ✅ Dashboard affiche statistiques :
  - Points : 120
  - Commandes : 2
  - Abonnements : 1

**Actions à tester :**
1. Clic "Voir promotions" → liste 2 promos (15.5% discount, 25% discount) ✅
2. Clic "Réclamer cette offre" sur promo 1 (15.5%, 50 pts requis):
   - ✅ Confirmation modale
   - ✅ Points décrémentés: 120 - 50 = 70 pts
   - ✅ Toast succès + rafraîchissement liste
   - ✅ Vérifier dans DB: `promotion_claims` a un enregistrement
3. Tenter réclamer avec points insuffisants:
   - ✅ Toast erreur "Points insuffisants"
   - ✅ Bouton "Réclamer" désactivé si <points_required
4. Clic "Voir mon historique" → affiche promo réclamée avec date ✅

---

### ✅ Test 4 : Livreur

**Connexion :**
- Email : `livreur@test.com`
- Password : `password`

**Après connexion :**
- ✅ Redirection automatique vers `/livreur`
- ✅ Dashboard affiche statistiques :
  - Assignées : 5
  - Livrées : 120
  - Note : 4.8

**Actions à tester :**
1. Clic "Voir mes missions" → page assignments ✅
2. Navbar → "Tableau de bord" pointe vers `/livreur` ✅
3. Sidebar → "Performance" → stats livreur ✅

---

### ✅ Test 5 : Vérificateur

**Connexion :**
- Email : `verificateur@test.com`
- Password : `password`

**Après connexion :**
- ✅ Redirection automatique vers `/verificateur`
- ✅ Dashboard affiche statistiques :
  - Validés : 340
  - En attente : 4

**Actions à tester :**
1. Formulaire "Validation manuelle" visible ✅
2. Navbar → "Tableau de bord" pointe vers `/verificateur` ✅
3. Sidebar → "Historique" → page historique validations ✅

---

### ✅ Test 6 : Entreprise

**Connexion :**
- Email : `entreprise@test.com`
- Password : `password`

**Après connexion :**
- ✅ Redirection automatique vers `/entreprise`
- ✅ Dashboard affiche statistiques :
  - Employés : 0
  - Commandes : 0
  - Budget : 0

**Actions à tester :**
1. Clic "Voir rapports" → page rapports entreprise ✅
2. Navbar → "Tableau de bord" pointe vers `/entreprise` ✅

---

## 🔍 Tests API Backend

### Test endpoints stats (avec JWT)

**1. Obtenir token JWT :**
```powershell
$body = @{
    email = "admin@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

**2. Tester route stats admin :**
```powershell
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/admin/stats" -Headers $headers
```

**Attendu :**
```json
{
  "orders": 2,
  "revenue": ...,
  "revenue_currency": "USD",
  "subscriptions": 1
}
```

**3. Tester route menus :**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus" -Headers $headers
```

**Attendu :** Liste de 5 menus

---

## ✅ Checklist Complète

### Frontend
- [ ] Landing page s'affiche correctement
- [ ] Login redirige vers bon dashboard selon rôle
- [ ] Navbar "Tableau de bord" dynamique par rôle
- [ ] Logout fonctionne et redirige vers `/`
- [ ] Toutes les pages par rôle s'affichent sans erreur

### Backend
- [ ] Route `POST /api/login` retourne JWT
- [ ] Route `GET /api/me` retourne user avec rôle
- [ ] Routes stats par rôle retournent données
- [ ] Routes menus/orders/promotions fonctionnent
- [ ] Middleware `role:X` bloque accès non autorisé

### Base de données
- [ ] 6 utilisateurs créés (tous rôles)
- [ ] 5 menus créés (dont 1 pending)
- [ ] 2 commandes créées
- [ ] 1 abonnement actif
- [ ] 2 promotions actives
- [ ] Solde points client = 120

---

## 🐛 Erreurs Fréquentes

### "Unauthenticated" sur stats
→ Token JWT expiré ou invalide. Se reconnecter.

### Stats affichent "—"
→ API ne répond pas. Vérifier que backend tourne sur :8000.

### Redirection échoue après login
→ Vérifier que `user.role` est bien retourné dans réponse `/api/login`.

### CORS error
→ Ajouter dans `backend/.env` :
```env
SANCTUM_STATEFUL_DOMAINS=localhost:3000
FRONTEND_URL=http://localhost:3000
```

---

## 📊 Résultats Attendus

Si tous les tests passent :
- ✅ **6 rôles fonctionnels** avec dashboards distincts
- ✅ **Navigation dynamique** selon rôle utilisateur
- ✅ **Routes API protégées** par JWT + middleware role
- ✅ **Données de test** cohérentes et réalistes
- ✅ **Flux auth complet** login → JWT → redirection → stats

---

## 🚀 Prochaines Étapes

- ✅ **Flux livreur** : assignation automatique à la validation du code, stats par livreur
- ✅ **Flux vérificateur** : ticket `GXT-XXXXXXXX` généré à la réclamation, validation complète
- ✅ **Upload images menus** : bouton "Uploader une image" (Cloudinary) sur création/édition menu (cuisinier + admin)
- ✅ **Webhook Shwary** : vérification signature optionnelle (`SHWARY_WEBHOOK_SECRET`), `PaymentController` avec signature
- ✅ **Tests automatisés** : PHPUnit (PromotionClaim, Verificateur, Livreur), Playwright E2E (promotions, vérificateur)

À faire :
1. Valider manuellement tous les scénarios de ce guide
2. Déployer en production (voir DEPLOYMENT.md)

### Lancer les tests automatisés

**Backend (PHPUnit) :**
```bash
cd backend
php artisan test
# Ou un fichier : php artisan test tests/Feature/VerificateurControllerTest.php
```

**Frontend (Playwright E2E) :**
```bash
# 1. Démarrer le backend (obligatoire pour login)
cd backend && php artisan serve

# 2. Dans un autre terminal : frontend
cd frontend-next
npm install
npx playwright install
npm run dev

# 3. Dans un 3e terminal : lancer les tests
cd frontend-next
npm run test:e2e
```
*(Le backend doit tourner sur http://127.0.0.1:8000 pour que le login fonctionne.)*

### Configuration optionnelle

- **Signature webhook Shwary** : dans `backend/.env`, ajouter `SHWARY_WEBHOOK_SECRET=votre_secret` pour vérifier les callbacks.
- **Ticket client** : après réclamation d’une promo, le client reçoit un code type `GXT-XXXXXXXX` à présenter au vérificateur.

---

**Bonne chance ! 🎉**
