# Variables d'environnement Render (backend)

Ces variables doivent être configurées dans le dashboard Render :
**Dashboard → greenexpress-api → Environment**

## Base de données
```
DB_CONNECTION=pgsql
DB_URL=postgresql://USER:PASS@HOST:5432/db_greenexpress
# ou séparément :
DB_HOST=
DB_PORT=5432
DB_DATABASE=db_greenexpress
DB_USERNAME=
DB_PASSWORD=
DB_SSLMODE=require
```

## Application Laravel
```
APP_NAME="Green Express"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...        # php artisan key:generate
APP_URL=https://greenexpress-api.onrender.com
LOG_CHANNEL=stderr
LOG_LEVEL=debug
```

## Real-time (Pusher Cloud - obligatoire sur Render)
```
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=...
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...
PUSHER_APP_CLUSTER=eu
```

## Push notifications (Pusher Beams)
```
PUSHER_BEAMS_INSTANCE_ID=c5f54ada-951e-4f4e-86aa-47048a4bc842
PUSHER_BEAMS_SECRET_KEY=...
```

## Files / Cache / Queue
```
FILESYSTEM_DISK=local
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
```

## CORS / Frontend
```
FRONTEND_URL=https://greenexpress.onrender.com
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001,greenexpress.onrender.com
```

## Optionnel (Email, Cloudinary, FlexPay)
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
...
FLEXPAY_API_KEY=...
FLEXPAY_MERCHANT_CODE=...
FLEXPAY_WEBHOOK_SECRET=...
```

---

## Commandes rapides (Shell Render)

```bash
# Seeder production
php artisan config:clear && php artisan db:seed --class=RenderProductionSeeder --force

# Vérifier les variables
php artisan config:show database
```
