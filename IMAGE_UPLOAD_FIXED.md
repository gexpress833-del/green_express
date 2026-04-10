# ✅ Upload d'Images - Corrigé !

## 🐛 Le Problème

Le champ d'upload d'image était dans le code mais **ne s'affichait pas** à cause d'une incohérence :
- Le formulaire utilisait `menu_image`
- Le modèle utilisait Spatie Media Library avec `menu_images`
- Aucune colonne dans la table menus pour stocker l'image

## ✅ La Solution Appliquée

### 1. Migration Ajoutée
```php
// Nouvelle colonne 'image' dans table menus
Schema::table('menus', function (Blueprint $table) {
    $table->string('image')->nullable()->after('description');
});
```

### 2. Modèle Mis à Jour
```php
// Menu.php - Ajout 'image' au fillable
protected $fillable = [
    'title', 'description', 'image', 'price', ...
];
```

### 3. Formulaire Filament Corrigé
```php
// MenuResource.php - Champ upload simplifié et fonctionnel
Forms\Components\FileUpload::make('image')
    ->label('Image du plat')
    ->image()
    ->directory('menus')
    ->disk('public')
    ->imageEditor()
    ->maxSize(2048)
    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
```

### 4. Storage Link Créé
```bash
php artisan storage:link
```
→ Les images seront accessibles via `http://127.0.0.1:8000/storage/menus/nom-image.jpg`

## 🎨 Résultat Attendu

### Dans le Formulaire Filament
Tu devrais maintenant voir :

```
┌─────────────────────────────────────┐
│ Image du menu                       │
├─────────────────────────────────────┤
│                                     │
│  Image du plat                      │
│  ┌─────────────────────────────┐   │
│  │  Glisser-déposer ou cliquer │   │
│  │  pour choisir un fichier    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Formats: JPG, PNG, WEBP (Max: 2MB)│
│  Choisissez une belle photo         │
│                                     │
└─────────────────────────────────────┘
```

## 🧪 Test Rapide

### 1. Rafraîchir la Page Filament
```
Ctrl + F5 (rafraîchir cache navigateur)
ou
Fermer/Rouvrir le formulaire d'édition menu
```

### 2. Créer ou Éditer un Menu
1. Aller sur `/admin/menus`
2. Cliquer "Créer" ou éditer un menu existant
3. Tu devrais voir la section **"Image du menu"**
4. Glisser-déposer une image ou cliquer pour choisir

### 3. Vérifier l'Upload
1. Choisir une image (JPG/PNG/WEBP)
2. L'image s'affiche en prévisualisation
3. Sauvegarder le menu
4. Image stockée dans `storage/app/public/menus/`
5. Accessible via `http://127.0.0.1:8000/storage/menus/nom-image.jpg`

## 📂 Structure Fichiers

```
backend/
├── storage/
│   └── app/
│       └── public/
│           └── menus/          ← Images uploadées ici
│               ├── image1.jpg
│               ├── image2.png
│               └── ...
├── public/
│   └── storage/               ← Lien symbolique vers storage/app/public
│       └── menus/             (accessible publiquement)
```

## 🔧 Fonctionnalités Disponibles

### Upload
- ✅ Glisser-déposer
- ✅ Clic pour choisir fichier
- ✅ Formats acceptés : JPEG, PNG, WEBP
- ✅ Taille max : 2MB
- ✅ Prévisualisation immédiate

### Éditeur d'Image (Filament)
- ✅ Recadrer l'image
- ✅ Rotation
- ✅ Ajuster zoom
- ✅ Prévisualisation en temps réel

### Stockage
- ✅ Dossier organisé : `storage/app/public/menus/`
- ✅ Noms uniques automatiques (évite conflits)
- ✅ Accessible publiquement via `/storage/menus/`

## 🌐 Utilisation Frontend (Next.js)

### Afficher l'Image dans Frontend

```jsx
// Dans MenuCard.jsx ou autre composant
{menu.image && (
  <img 
    src={`http://127.0.0.1:8000/storage/${menu.image}`}
    alt={menu.title}
    className="menu-image"
  />
)}
```

### API Backend Retourne

```json
{
  "id": 1,
  "title": "Poulet Moambe",
  "description": "...",
  "price": 15000,
  "currency": "CDF",
  "image": "menus/abc123def456.jpg",  ← Chemin relatif
  "status": "approved"
}
```

Frontend construit l'URL complète :
```
http://127.0.0.1:8000/storage/menus/abc123def456.jpg
```

## 🚀 Pour Production

### Configuration .env Production
```env
FILESYSTEM_DISK=s3
AWS_BUCKET=green-express-images
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### Ou Cloudinary (déjà configuré)
```env
CLOUDINARY_URL=cloudinary://...
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## ❓ Problèmes Possibles

### "Le champ ne s'affiche toujours pas"
```bash
# Vider cache Laravel
cd C:\SERVICE\backend
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Vider cache navigateur
Ctrl + Shift + Delete
ou Ctrl + F5
```

### "Erreur lors de l'upload"
```bash
# Vérifier permissions dossier storage
cd C:\SERVICE\backend\storage\app
mkdir public\menus
# Sur Windows, pas besoin de chmod
```

### "Image uploadée mais ne s'affiche pas"
```bash
# Vérifier le lien symbolique
php artisan storage:link

# Vérifier que l'image existe
dir storage\app\public\menus
```

### "404 sur l'URL de l'image"
```
Vérifier :
1. Lien symbolique créé : public/storage existe
2. Image dans storage/app/public/menus/
3. URL correcte : http://127.0.0.1:8000/storage/menus/nom.jpg
```

## ✅ Checklist Validation

- [ ] Migration exécutée (`image` column added)
- [ ] Storage link créé
- [ ] Page Filament rafraîchie (Ctrl+F5)
- [ ] Section "Image du menu" visible dans formulaire
- [ ] Upload fonctionne (glisser-déposer)
- [ ] Prévisualisation s'affiche
- [ ] Image sauvegardée dans DB
- [ ] Image accessible via URL publique

---

**🎉 Le champ d'upload d'image est maintenant fonctionnel !**

*Rafraîchis la page Filament (Ctrl+F5) et tu devrais voir la section "Image du menu"* 📸
