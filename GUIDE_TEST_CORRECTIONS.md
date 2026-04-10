# 🧪 Guide de Test des Corrections

Ce guide vous permet de tester manuellement toutes les corrections effectuées.

---

## 📋 Prérequis

1. **Backend démarré:**
   ```bash
   cd C:\SERVICE\backend
   php artisan serve
   ```

2. **Base de données migrée et seedée:**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

3. **Token JWT obtenu** (voir section Authentification)

---

## 🔐 1. Test Authentification (Middleware Authenticate)

### Test 1.1: Obtenir un token JWT
```powershell
$body = @{
    email = "admin@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

**✅ Attendu:** Token JWT retourné

### Test 1.2: Accès sans token (doit échouer)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/me" -Method Get
```

**✅ Attendu:** Erreur 401 "Unauthenticated"

### Test 1.3: Accès avec token (doit réussir)
```powershell
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/me" -Headers $headers
```

**✅ Attendu:** Informations utilisateur retournées

---

## 🔒 2. Test Filtrage par Utilisateur

### Test 2.1: OrderController.index() - Client voit seulement ses commandes
```powershell
# Se connecter en tant que client
$body = @{
    email = "client@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$clientToken = $response.token

$headers = @{
    Authorization = "Bearer $clientToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/orders" -Headers $headers
```

**✅ Attendu:** Seulement les commandes du client connecté

### Test 2.2: OrderController.index() - Admin voit toutes les commandes
```powershell
$headers = @{
    Authorization = "Bearer $token"  # Token admin
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/orders" -Headers $headers
```

**✅ Attendu:** Toutes les commandes

### Test 2.3: SubscriptionController.index() - Filtrage par utilisateur
```powershell
# Avec token client
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/subscriptions" -Headers $headers
```

**✅ Attendu:** Seulement les abonnements du client

---

## 👤 3. Test UserController - Pagination et Filtres

### Test 3.1: Liste des utilisateurs avec pagination
```powershell
$headers = @{
    Authorization = "Bearer $token"  # Token admin
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users" -Headers $headers
```

**✅ Attendu:** Réponse avec pagination (data, current_page, per_page, total, etc.)

### Test 3.2: Filtre par rôle
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users?role=client" -Headers $headers
```

**✅ Attendu:** Seulement les utilisateurs avec rôle "client"

### Test 3.3: Recherche par nom/email
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users?search=admin" -Headers $headers
```

**✅ Attendu:** Utilisateurs dont le nom ou email contient "admin"

---

## 🍽️ 4. Test MenuController - Vérification Propriétaire

### Test 4.1: Créer un menu (cuisinier)
```powershell
# Se connecter en tant que cuisinier
$body = @{
    email = "cuisinier@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$cuisinierToken = $response.token

$headers = @{
    Authorization = "Bearer $cuisinierToken"
    "Content-Type" = "application/json"
}

$menuData = @{
    title = "Menu Test"
    description = "Description test"
    price = 15.50
    currency = "USD"
} | ConvertTo-Json

$menu = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus" -Method Post -Body $menuData -Headers $headers
$menuId = $menu.id
Write-Host "Menu créé avec ID: $menuId"
```

**✅ Attendu:** Menu créé avec created_by = ID du cuisinier

### Test 4.2: Modifier son propre menu (doit réussir)
```powershell
$updateData = @{
    title = "Menu Test Modifié"
    price = 18.00
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus/$menuId" -Method Put -Body $updateData -Headers $headers
```

**✅ Attendu:** Menu modifié avec succès

### Test 4.3: Modifier le menu d'un autre (doit échouer)
```powershell
# Se connecter en tant que client
$body = @{
    email = "client@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$clientToken = $response.token

$headers = @{
    Authorization = "Bearer $clientToken"
    "Content-Type" = "application/json"
}

$updateData = @{
    title = "Tentative de modification"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus/$menuId" -Method Put -Body $updateData -Headers $headers
} catch {
    Write-Host "Erreur attendue: $_"
}
```

**✅ Attendu:** Erreur 403 "Forbidden. You can only update your own menus."

### Test 4.4: Admin peut modifier n'importe quel menu
```powershell
$headers = @{
    Authorization = "Bearer $token"  # Token admin
    "Content-Type" = "application/json"
}

$updateData = @{
    title = "Modifié par admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus/$menuId" -Method Put -Body $updateData -Headers $headers
```

**✅ Attendu:** Menu modifié avec succès

---

## 🛒 5. Test OrderController - Validation Complète

### Test 5.1: Créer une commande avec validation
```powershell
$headers = @{
    Authorization = "Bearer $clientToken"
    "Content-Type" = "application/json"
}

# D'abord, obtenir un menu_id valide
$menus = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus" -Headers $headers
$menuId = $menus.data[0].id  # Premier menu de la liste

$orderData = @{
    items = @(
        @{
            menu_id = $menuId
            quantity = 2
        }
    )
    delivery_address = "123 Rue Test, Paris"
} | ConvertTo-Json

$order = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/orders" -Method Post -Body $orderData -Headers $headers
$orderUuid = $order.uuid
Write-Host "Commande créée avec UUID: $orderUuid"
```

**✅ Attendu:** 
- Commande créée
- total_amount calculé automatiquement
- points_earned calculé automatiquement
- Points ajoutés au solde utilisateur

### Test 5.2: Créer une commande avec menu_id invalide (doit échouer)
```powershell
$invalidOrderData = @{
    items = @(
        @{
            menu_id = 99999  # ID inexistant
            quantity = 1
        }
    )
    delivery_address = "Test"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/orders" -Method Post -Body $invalidOrderData -Headers $headers
} catch {
    Write-Host "Erreur attendue: $_"
}
```

**✅ Attendu:** Erreur 422 avec message de validation

---

## 🎁 6. Test PromotionController - Middleware Admin

### Test 6.1: Créer promotion sans être admin (doit échouer)
```powershell
$headers = @{
    Authorization = "Bearer $clientToken"  # Token client
    "Content-Type" = "application/json"
}

$promoData = @{
    discount = 10
    points_required = 100
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/promotions" -Method Post -Body $promoData -Headers $headers
} catch {
    Write-Host "Erreur attendue: $_"
}
```

**✅ Attendu:** Erreur 403 "Forbidden"

### Test 6.2: Créer promotion en tant qu'admin (doit réussir)
```powershell
$headers = @{
    Authorization = "Bearer $token"  # Token admin
    "Content-Type" = "application/json"
}

$promoData = @{
    discount = 15
    points_required = 150
    start_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    end_at = (Get-Date).AddDays(30).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json

$promo = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/promotions" -Method Post -Body $promoData -Headers $headers
```

**✅ Attendu:** Promotion créée avec admin_id = ID de l'admin

---

## 📄 7. Test Pagination

### Test 7.1: MenuController avec pagination
```powershell
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Sans paramètre (pagination par défaut)
$menus = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus" -Headers $headers
Write-Host "Page actuelle: $($menus.current_page)"
Write-Host "Par page: $($menus.per_page)"
Write-Host "Total: $($menus.total)"

# Avec paramètre per_page
$menus = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus?per_page=5" -Headers $headers
```

**✅ Attendu:** Réponse avec pagination (data, current_page, per_page, total, last_page, etc.)

### Test 7.2: Filtres MenuController
```powershell
# Filtre par statut
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus?status=approved" -Headers $headers

# Recherche par titre
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus?search=test" -Headers $headers

# Filtre par créateur
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus?created_by=1" -Headers $headers
```

**✅ Attendu:** Résultats filtrés correctement

---

## 📊 8. Test Stats Contrôleurs

### Test 8.1: LivreurController.stats()
```powershell
# Se connecter en tant que livreur
$body = @{
    email = "livreur@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$livreurToken = $response.token

$headers = @{
    Authorization = "Bearer $livreurToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/livreur/stats" -Headers $headers
```

**✅ Attendu:** Stats calculées depuis la DB (assigned, delivered, rating)

### Test 8.2: VerificateurController.stats()
```powershell
# Se connecter en tant que vérificateur
$body = @{
    email = "verificateur@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$verifToken = $response.token

$headers = @{
    Authorization = "Bearer $verifToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/verificateur/stats" -Headers $headers
```

**✅ Attendu:** Stats calculées (validated, pending, last)

### Test 8.3: EntrepriseController.stats()
```powershell
# Se connecter en tant qu'entreprise
$body = @{
    email = "entreprise@test.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post -Body $body -ContentType "application/json"
$entrepriseToken = $response.token

$headers = @{
    Authorization = "Bearer $entrepriseToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/entreprise/stats" -Headers $headers
```

**✅ Attendu:** Stats calculées (employees, orders, budget)

---

## 🖼️ 9. Test Upload Images (MenuController)

### Test 9.1: Créer menu avec image (URL)
```powershell
$headers = @{
    Authorization = "Bearer $cuisinierToken"
    "Content-Type" = "application/json"
}

$menuData = @{
    title = "Menu avec Image"
    description = "Test upload image"
    price = 20.00
    currency = "USD"
    image = "https://example.com/image.jpg"
} | ConvertTo-Json

$menu = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/menus" -Method Post -Body $menuData -Headers $headers
```

**✅ Attendu:** Menu créé avec image URL

### Test 9.2: Upload image via fichier (nécessite multipart/form-data)
```powershell
# Note: Ce test nécessite un fichier image réel
# Utiliser Postman ou curl pour tester l'upload de fichier
# curl -X POST "http://127.0.0.1:8000/api/menus" \
#   -H "Authorization: Bearer $cuisinierToken" \
#   -F "title=Menu avec Image Upload" \
#   -F "price=25.00" \
#   -F "image_file=@/path/to/image.jpg"
```

**✅ Attendu:** 
- Si Cloudinary configuré: Image uploadée sur Cloudinary
- Sinon: Image stockée localement dans storage/app/public/menus

---

## ✅ 10. Test OrderController.validateCode()

### Test 10.1: Valider un code de livraison
```powershell
# D'abord, créer une commande et obtenir son UUID
# (voir Test 5.1)

# Générer un code de livraison (6 caractères)
$deliveryCode = -join ((65..90) + (48..57) | Get-Random -Count 6 | ForEach-Object {[char]$_})
Write-Host "Code généré: $deliveryCode"

# Mettre à jour la commande avec le code (nécessite accès admin ou endpoint dédié)
# Pour le test, on suppose que le code est déjà dans la commande

$validateData = @{
    code = $deliveryCode
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/orders/$orderUuid/validate-code" -Method Post -Body $validateData -Headers $headers
} catch {
    Write-Host "Erreur: $_"
}
```

**✅ Attendu:** 
- Si code valide: Status mis à jour à "delivered"
- Si code invalide: Erreur 400 avec message

---

## 🧪 11. Test Gestion d'Erreurs

### Test 11.1: Erreur de validation (422)
```powershell
$headers = @{
    Authorization = "Bearer $clientToken"
    "Content-Type" = "application/json"
}

$invalidData = @{
    items = @()  # Array vide (doit échouer)
    delivery_address = ""  # Vide (doit échouer)
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/orders" -Method Post -Body $invalidData -Headers $headers
} catch {
    $_.Exception.Response
}
```

**✅ Attendu:** Erreur 422 avec détails de validation

### Test 11.2: Erreur serveur (500) - Vérifier gestion d'exception
```powershell
# Tester avec des données qui causent une erreur serveur
# (ex: connexion DB interrompue, etc.)
```

**✅ Attendu:** Message d'erreur structuré (message + error si debug activé)

---

## 📝 Checklist Complète

### Sécurité
- [ ] Middleware Authenticate fonctionne
- [ ] Filtrage par utilisateur dans OrderController
- [ ] Filtrage par utilisateur dans SubscriptionController
- [ ] Vérification propriétaire dans MenuController
- [ ] Middleware admin sur PromotionController

### Fonctionnalités
- [ ] Validation complète OrderController.store()
- [ ] Calcul automatique des points
- [ ] Validation currency dans MenuController
- [ ] Pagination dans MenuController
- [ ] Pagination dans PromotionController
- [ ] Pagination dans UserController
- [ ] Filtres et recherche fonctionnent

### Logique Métier
- [ ] LivreurController calcule depuis DB
- [ ] VerificateurController calcule depuis DB
- [ ] EntrepriseController calcule depuis DB
- [ ] OrderController.validateCode() fonctionne

### Upload Images
- [ ] Upload avec URL fonctionne
- [ ] Upload avec fichier fonctionne (Cloudinary ou local)

### Gestion d'Erreurs
- [ ] Erreurs 422 (validation) bien gérées
- [ ] Erreurs 500 bien gérées
- [ ] Messages d'erreur clairs

---

## 🐛 Dépannage

### Erreur "Class 'Cloudinary\Uploader' not found"
→ Installer le package: `composer require cloudinary/cloudinary_php`

### Erreur "Unauthenticated"
→ Vérifier que le token JWT est valide et non expiré

### Erreur CORS
→ Vérifier la configuration dans `backend/config/cors.php` et `.env`

### Erreur de pagination
→ Vérifier que la réponse contient bien les clés de pagination Laravel

---

**Bon test ! 🎉**
