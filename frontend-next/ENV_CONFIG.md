# Configuration Frontend (.env.local)

## Instructions

Créez le fichier `frontend-next/.env.local` avec le contenu suivant :

```env
# Backend API URL
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api

# Vercel Blob (optionnel, pour upload images)
NEXT_PUBLIC_BLOB_BASE=https://vercel.blob.greenexpress.app

# Cloudinary (optionnel alternative)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

## Variables importantes

### NEXT_PUBLIC_API_BASE
- URL complète du backend API **avec `/api`**
- Par défaut : `http://127.0.0.1:8000/api`
- Production : `https://api.votre-domaine.com/api`

### Upload images (optionnel)
- **Vercel Blob** : solution cloud simple
- **Cloudinary** : alternative robuste (déjà configuré côté backend)

## Commande rapide

```bash
cd C:\SERVICE\frontend-next
copy .env.local.example .env.local
notepad .env.local
```

## Notes
- Les variables `NEXT_PUBLIC_*` sont accessibles côté client
- Ne jamais mettre de secrets sensibles dans ces variables
