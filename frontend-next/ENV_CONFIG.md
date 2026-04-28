# Configuration Frontend (.env.local)

## Instructions

Créez le fichier `frontend-next/.env.local` avec le contenu suivant :

```env
# Backend API URL
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api

# URL API utilisée par le client (origine, sans /api)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Vercel Blob (optionnel, pour upload images)
NEXT_PUBLIC_BLOB_BASE=https://vercel.blob.greenexpress.app

# Cloudinary (optionnel alternative)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# Notifications realtime (WebSocket, optionnel)
NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED=false
NEXT_PUBLIC_NOTIFICATIONS_WS_LOAD_CDN=true
NEXT_PUBLIC_NOTIFICATIONS_WS_CHANNEL=App.Models.User.{userId}
NEXT_PUBLIC_NOTIFICATIONS_WS_EVENT=.Illuminate\Notifications\Events\BroadcastNotificationCreated
NEXT_PUBLIC_NOTIFICATIONS_WS_BROADCASTER=pusher
NEXT_PUBLIC_NOTIFICATIONS_WS_KEY=green-express
NEXT_PUBLIC_NOTIFICATIONS_WS_CLUSTER=mt1
NEXT_PUBLIC_NOTIFICATIONS_WS_HOST=localhost
NEXT_PUBLIC_NOTIFICATIONS_WS_PORT=6001
NEXT_PUBLIC_NOTIFICATIONS_WS_WSS_PORT=443
NEXT_PUBLIC_NOTIFICATIONS_WS_FORCE_TLS=false
```

## Production : Pusher cloud (recommandé, zéro infra)

Sur Vercel / Netlify, définissez :

```env
NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED=true
NEXT_PUBLIC_NOTIFICATIONS_WS_BROADCASTER=pusher
NEXT_PUBLIC_NOTIFICATIONS_WS_KEY=<PUSHER_APP_KEY>
NEXT_PUBLIC_NOTIFICATIONS_WS_CLUSTER=eu
NEXT_PUBLIC_NOTIFICATIONS_WS_FORCE_TLS=true
# Laisser HOST/PORT/WSS_PORT VIDES → le SDK Pusher utilise le cluster cloud automatiquement.
```

Côté backend (Render / VPS) :

```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=...
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...
PUSHER_APP_CLUSTER=eu
```

> ⚠️ `PUSHER_APP_KEY` (backend) doit correspondre à `NEXT_PUBLIC_NOTIFICATIONS_WS_KEY` (frontend).


## Variables importantes

### NEXT_PUBLIC_API_BASE
- URL complète du backend API **avec `/api`**
- Par défaut : `http://127.0.0.1:8000/api`
- Production : `https://api.votre-domaine.com/api`

### Upload images (optionnel)
- **Vercel Blob** : solution cloud simple
- **Cloudinary** : alternative robuste (déjà configuré côté backend)

### Notifications realtime (optionnel)
- Activez `NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED=true` pour écouter les notifications en direct.
- Le frontend garde le polling (30s) en fallback si WebSocket indisponible.
- `NEXT_PUBLIC_NOTIFICATIONS_WS_HOST/PORT` doivent correspondre au serveur WebSocket backend.

## Commande rapide

```bash
cd C:\SERVICE\frontend-next
copy .env.local.example .env.local
notepad .env.local
```

## Notes
- Les variables `NEXT_PUBLIC_*` sont accessibles côté client
- Ne jamais mettre de secrets sensibles dans ces variables
