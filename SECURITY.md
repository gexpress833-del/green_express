# 🔐 Green Express - Guide de Sécurité

## Mesures de Sécurité Implémentées

### 1. Authentification & Authorization
- ✅ **JWT Token-based Auth** via `tymon/jwt-auth`
- ✅ **Role-based Middleware** - Chaque endpoint protégé par `->middleware('role:admin')`
- ✅ **Token Expiry** - Tokens expirés renvoyent 401 Unauthorized
- ✅ **Protected Routes** - Toutes les routes sensibles nécessitent `auth:api`

### 2. Rate Limiting
- ✅ **Auth endpoints** (login/register): 5 requêtes par minute par IP
- ✅ **Promotion claim**: 20 requêtes par minute
- ✅ **Image upload**: 10 requêtes par minute
- ✅ Utilise Laravel's throttle middleware

### 3. Validation & Input Sanitization
- ✅ **Backend Validation** - Toutes les entrées validées avec Laravel Validator
  - Dates: format `Y-m-d\TH:i`
  - `exists:menus,id` - Vérification référentielle
  - `numeric|min:0|max:100` - Validations plages
  - `|string|max:255` - Limites longueur chaînes

- ✅ **Frontend Validation** - Vérifications côté client (UX)
  - Toaster notifications pour erreurs
  - Boutons désactivés si données invalides
  - Prévisualisations images avant upload

### 4. Database Security
- ✅ **Transactions Atomiques** - Claim promotion utilise `DB::transaction()` avec locks
  - `lockForUpdate()` sur Promotion et Points
  - Évite race conditions et sur-vente
  - Rollback automatique en cas erreur

- ✅ **Foreign Keys** - Constraints intégrités:
  ```php
  $table->foreignId('user_id')->constrained()->onDelete('cascade');
  $table->unique(['user_id', 'promotion_id']); // Un claim par utilisateur/promo
  ```

### 5. File Upload Security
- ✅ **MIME Type Validation**: `mimes:jpeg,png,jpg,webp`
- ✅ **Size Limit**: 5MB max
- ✅ **Cloudinary Upload** - Images stockées externalement
- ✅ **Secure URLs** - HTTPS returned by Cloudinary

### 6. API Security
- ✅ **CORS Configuration** - Whitelist domaines frontend
- ✅ **No Sensitive Data in Response** - Passwords jamais retournés
- ✅ **Error Handling** - Messages génériques en production (`config('app.debug')`)
- ✅ **Request Logging** - Erreurs logées avec contexte pour debug

### 7. JWT Best Practices
- ✅ **Token Refresh** - Tokens expirent automatiquement
- ✅ **Secret Key** - stockée dans `.env` (jamais commitée)
- ✅ **Algorithm** - HS256 par défaut (sécurisé)
- ✅ **Header Validation** - JWT vérifié côté serveur

### 8. Monitorn & Logging
- ✅ **Error Logging** - Tous les exceptions loggées via Laravel Log Channels
- ✅ **Debug Mode** - Désactivé en production (`APP_DEBUG=false`)
- ✅ **Sensitive Info Masking** - Passwords jamais visibles dans logs

## Améliorations Futures

### Phase 4.2 (À faire)
- [ ] Ajouter **2FA** (Two-Factor Authentication) via TOTP
- [ ] Implémenter **CSRF Protection** pour les formulaires
- [ ] Ajouter **Sentry** pour monitoring production
- [ ] Rate-limiting par utilisateur (au lieu que par IP)
- [ ] **IP Whitelist** pour admin endpoints

### Phase 5 (Production)
- [ ] Audit de sécurité par tiers
- [ ] Penetration testing
- [ ] OWASP Top 10 compliance review
- [ ] Encryption de données sensibles (points, prix)
- [ ] VPN/SSL obligatoire pour API

## Secrets Management

### Variables Sensibles (`.env`)
```env
APP_KEY=                          # Clé app Laravel
JWT_SECRET=                       # Secret JWT
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SANCTUM_STATEFUL_DOMAINS=        # CORS
DB_PASSWORD=                      # DB password
```

**⚠️ JAMAIS commiter `.env` en repository.**

## Commandes de Sécurité

```bash
# Vérifier JWT secret existe
php artisan:tinker
>>> config('jwt.secret')
=> "xxxx..."

# Tester rate limiting
# (envoyer >5 requêtes login en <1 min)

# Vérifier migrations intégrités
php artisan migrate:status

# Tester endpoints protégés
curl -H "Authorization: Bearer INVALID" http://127.0.0.1:8000/api/me
# Response: 401 Unauthorized
```

## Checklist Sécurité

- [x] Tous les endpoints protégés par rôles
- [x] Input validation robuste
- [x] Rate limiting
- [x] Transactions atomiques
- [x] Logs d'erreurs
- [ ] 2FA
- [ ] Sentry monitoring
- [ ] Production hardening

---

**Dernier audit:** 18 Février 2026  
**Responsable:** DevTeam  
**Contact:** security@greenexpress.com
