# 🖼️ Guide Cloudinary - Configuration & Tests

## 📋 État de l'intégration

✅ **Complétée**: SDK Cloudinary PHP v2 intégré  
✅ **CloudinaryService.php**: Créé avec upload, delete, transform  
✅ **config/cloudinary.php**: Configuration centralisée  
✅ **Routes API**: 4 endpoints enregistrés  

---

## 🔧 Configuration

### 1. Ajouter les identifiants Cloudinary à `.env`

```env
# backend/.env
CLOUDINARY_CLOUD_NAME=dsbi4hmd7
CLOUDINARY_API_KEY=<votre_api_key>
CLOUDINARY_API_SECRET=<votre_api_secret>
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 2. Obtenir les identifiants (gratuit)

1. Aller à https://cloudinary.com
2. S'inscrire (50 GB/mois gratuit)
3. Dashboard → Settings → API Keys
4. Copier `Cloud Name`, `API Key`, `API Secret`

**Cloud Name fourni** : `dsbi4hmd7` ✅

---

## 🧪 Tests Locaux

### Prerequisites

```powershell
cd C:\SERVICE\backend

# Installer dépendances (si pas déjà fait)
composer install

# Générer JWT secret
php artisan jwt:secret

# Initialiser DB
php artisan migrate:fresh --seed

# Démarrer le serveur
php artisan serve --port=8000
```

### Test 1: Vérifier la configuration Cloudinary

**Request** (curl):
```bash
curl -X GET http://127.0.0.1:8000/api/upload/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**PowerShell**:
```powershell
# 1. Obtenir token
$loginBody = @{
    email = "admin@test.com"
    password = "password"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" -Method Post `
    -Body $loginBody -ContentType "application/json"
$token = $loginResp.token

# 2. Tester config Cloudinary
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/upload/config" `
    -Headers $headers -Method Get
```

**Résultat attendu**:
```json
{
  "status": "ok",
  "cloud_name": "dsbi4hmd7",
  "api_key": "xxxxx***",
  "message": "Cloudinary is properly configured"
}
```

---

### Test 2: Upload une image

**PowerShell**:
```powershell
# Préparer le fichier de test
$imagePath = "C:\path\to\test-image.jpg"

# Créer FormData
$form = @{
    image = Get-Item -Path $imagePath
    folder = "menus"
}

# Upload
$uploadResp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/upload-image" `
    -Headers $headers -Method Post -Form $form

$uploadResp | ConvertTo-Json
```

**Résultat attendu**:
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/dsbi4hmd7/image/upload/v123456/green-express/menus/file.jpg",
  "message": "Image uploadée avec succès"
}
```

**Stockez l'URL retournée** pour le test suivant (`$imageUrl`).

---

### Test 3: Transformer une image (resize, crop)

**PowerShell**:
```powershell
# Extraire le public_id de l'URL uploadée
# Format: https://res.cloudinary.com/dsbi4hmd7/image/upload/v123/green-express/menus/file123

$publicId = "green-express/menus/file123"  # À remplacer par votre valeur

$transformParams = @{
    public_id = $publicId
    width = 400
    height = 400
    crop = "fill"
}

$query = "?" + ($transformParams.GetEnumerator() | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join "&"

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/upload-image/transform$query" `
    -Headers $headers -Method Get
```

**Résultat attendu**:
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/dsbi4hmd7/image/upload/w_400,h_400,c_fill/green-express/menus/file123"
}
```

---

### Test 4: Supprimer une image

**PowerShell**:
```powershell
$deleteBody = @{
    public_id = "green-express/menus/file123"  # À remplacer
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/upload-image" `
    -Headers $headers -Method Delete -Body $deleteBody `
    -ContentType "application/json"
```

**Résultat attendu**:
```json
{
  "success": true,
  "message": "Image supprimée avec succès"
}
```

---

## 🧩 Intégration Frontend (React/Next.js)

### Composant ImageUploader (optionnel)

Créer `frontend-next/app/components/ImageUploader.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { uploadImage } from '@/app/lib/api';

export default function ImageUploader({ folder = 'uploads', onUpload }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', folder);

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            onUpload?.(data.url);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={loading}
            />
            {loading && <p>Uploading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
```

---

## 📊 Résumé des Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/upload/config` | Vérifier config Cloudinary | ✅ |
| `POST` | `/api/upload-image` | Uploader image | ✅ |
| `DELETE` | `/api/upload-image` | Supprimer image | ✅ |
| `GET` | `/api/upload-image/transform` | Obtenir URL transformée | ✅ |

---

## 🚀 Prochaines Étapes

1. **Remplir les identifiants Cloudinary** dans `backend/.env`
2. **Tester l'upload** avec Test 1 et Test 2 ci-dessus
3. **Intégrer au formulaire de création menu** (Cuisinier/Admin)
4. **Ajouter image_url aux Menus** (migration + model)
5. **Afficher images** dans galerie produits (frontend)

---

## 🐛 Troubleshooting

### Erreur: "Cloudinary credentials not configured"

→ Vérifier que `.env` contient `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Erreur: "CLOUDINARY_URL format invalid"

→ Format doit être: `cloudinary://api_key:api_secret@cloud_name`

### Le fichier est uploadé mais une 500 apparaît

→ Vérifier les logs: `php artisan logs --tail=50`

### Image uploade mais URL vide

→ S'assurer que **`CLOUDINARY_CLOUD_NAME`** est configuré (obligatoire pour générer les URLs)

---

## 📚 Ressources

- [Documentation Cloudinary PHP SDK](https://cloudinary.com/documentation/php_integration)
- [API Référence Upload](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformations d'images](https://cloudinary.com/documentation/image_transformations)
