# 🚀 Green Express - Food Ordering System

[![Status](https://img.shields.io/badge/status-beta-yellowgreen)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A complete food ordering platform with role-based dashboards, promotion system, and delivery management.

## Features

✅ **6 Role-Based Dashboards**
- Admin: Full system management, creates promotions/menus
- Cuisinier: Submits menu items (pending admin approval)
- Client: Browse menus, claim promotions, earn points
- Livreur: Manage deliveries
- Vérificateur: Validate promotion tickets
- Entreprise: Team/budget management

✅ **Promotion System**
- Admin creates promotions with discount/points requirement
- Atomic claim with transaction locks (no overselling)
- Point deduction on claim
- Quantity tracking
- Claim history for users

✅ **Menu Management**
- Cuisinier submits dishes (status: pending)
- Admin approves/rejects
- Image uploads to Cloudinary
- Multi-currency support

✅ **Security**
- Session authentication with Laravel Sanctum
- Role-based middleware
- Rate limiting (login, claim, upload)
- Input validation (backend + frontend)
- CORS protection

✅ **UX Features**
- Toast notifications (success/error)
- Toaster component (global)
- Button disable states (smart validation)
- Loading states
- Empty states
- Real-time error messages

## Tech Stack

### Frontend
- **Next.js 13+** (App Router)
- **React 18** (hooks)
- **Tailwind CSS** (styling)
- **Axios** (API calls)

### Backend
- **Laravel 10+** (API)
- **PHP 8.1+**
- **Laravel Sanctum / session auth**
- **SQLite/PostgreSQL**

### Infrastructure
- **Cloudinary** (image storage)
- **pawaPay** (paiements Mobile Money)
- **Render** (backend hosting)
- **Vercel** (frontend hosting)

## Quick Start

### Development

```bash
# 1. Backend setup
cd backend
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve

# 2. Frontend setup (new terminal)
cd frontend-next
npm install
npm run dev

# 3. Open browser
# Frontend: http://localhost:3000
# Backend: http://127.0.0.1:8000
```

### Test Accounts

```
Admin:        admin@test.com / password
Cuisinier:    cuisinier@test.com / password
Client:       client@test.com / password (120 points)
Livreur:      livreur@test.com / password
Vérificateur: verificateur@test.com / password
Entreprise:   entreprise@test.com / password
```

## Project Structure

```
C:\SERVICE\
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── MenuController.php
│   │   │   ├── PromotionController.php
│   │   │   ├── UploadController.php
│   │   │   └── ...
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Menu.php
│   │   │   ├── Promotion.php
│   │   │   ├── PromotionClaim.php
│   │   │   └── ...
│   │   └── Services/
│   │       └── CloudinaryService.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── tests/
│       └── Feature/PromotionClaimTest.php
│
├── frontend-next/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Toaster.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   └── ...
│   │   ├── admin/
│   │   │   ├── menus/
│   │   │   ├── promotions/
│   │   │   └── page.jsx
│   │   ├── client/
│   │   │   └── promotions/page.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── imageLoader.js
│   │   └── styles/
│   │       └── globals.css
│   └── tests/
│       └── promotions.spec.ts
│
├── DEPLOYMENT.md          # Deployment guide
├── SECURITY.md            # Security measures
├── TEST_GUIDE.md          # Manual testing guide
└── README.md              # This file
```

## API Endpoints

Voir **[docs/API.md](docs/API.md)** pour la référence détaillée et **[docs/openapi.yaml](docs/openapi.yaml)** pour l’import OpenAPI (Postman, Swagger UI).

### Authentication
```
POST   /api/register           Create account
POST   /api/login              Open session
POST   /api/logout             Close session
GET    /api/me                 Get current user
```

### Menus
```
GET    /api/menus              List all menus (admin)
GET    /api/my-menus           List user's menus (cuisinier)
POST   /api/menus              Create menu
PUT    /api/menus/{id}         Update menu (admin)
DELETE /api/menus/{id}         Delete menu (admin)
```

### Promotions
```
GET    /api/promotions         List promotions (public)
POST   /api/promotions         Create promotion (admin)
POST   /api/promotions/{id}/claim    Claim promotion (client)
GET    /api/my-promotion-claims      User's claims
```

### Upload
```
POST   /api/upload-image       Upload image to Cloudinary
```

### Stats
```
GET    /api/admin/stats        Admin dashboard
GET    /api/client/stats       Client dashboard
GET    /api/cuisinier/stats    Cuisinier dashboard
```

## Workflows

### Promotion Claim Flow
```
1. Client sees promotion list (GET /api/promotions)
2. Client clicks "Réclamer cette offre"
   - Confirmation modal
   - Check: points enough? promo not expired? quantity > 0?
3. POST /api/promotions/{id}/claim
   - Transaction lock (atomic)
   - Deduct points
   - Decrement quantity
   - Create PromotionClaim record
4. Toast success + reload list
5. Get claim history (GET /api/my-promotion-claims)
```

### Menu Creation (Cuisinier)
```
1. Cuisinier goes to /cuisinier/menu/create
2. Fill form: title, description, price, currency, image
3. POST /api/menus → auto status='pending'
4. Admin sees in /admin/menus (status filter: pending)
5. Admin approves → status='approved'
6. Menu visible to clients
```

## Configuration

### Cloudinary Setup

1. Create account at https://cloudinary.com
2. Get credentials from dashboard
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
```

### Session / API URL

Backend:

```env
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Rate Limiting
Current limits:
- Login/Register: 5 req/min
- Promotion claim: 20 req/min
- Image upload: 10 req/min

Modify in `routes/api.php` or config middleware.

## Testing

### PHPUnit (Backend)
```bash
cd backend
php artisan test

# Specific test
php artisan test tests/Feature/PromotionClaimTest.php
```

### Frontend (tests manuels / E2E optionnel)
Les tests frontend sont couverts par des scénarios manuels (voir [TEST_GUIDE.md](TEST_GUIDE.md)). Pour ajouter des tests E2E avec Playwright :
```bash
cd frontend-next
npm install -D @playwright/test
npx playwright install
npx playwright test
```

### Manual Testing
See [TEST_GUIDE.md](TEST_GUIDE.md) for complete manual test scenarios.

## Security

- ✅ Session auth with Laravel Sanctum
- ✅ Role-based middleware
- ✅ Input validation (backend + frontend)
- ✅ Database transactions (promotion claims)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ No sensitive data in API responses
- ✅ File upload sanitization

See [SECURITY.md](SECURITY.md) for full details.

## Deployment

See `docs/DEPLOY_RENDER.md` for:
- Local development setup
- Deploy to Vercel (frontend)
- Deploy to Render (backend)
- Environment variables
- Monitoring & logs
- Troubleshooting

## Roadmap

### Phase 1 ✅ DONE
- [x] Core APIs (auth, menus, promotions, claims)
- [x] Role-based dashboards
- [x] Image uploads (Cloudinary)
- [x] Rate limiting
- [x] Basic tests

### Phase 2 ✅ DONE
- [x] Order system (menu → order → payment)
- [x] Delivery assignment (livreur : validate code)
- [x] Promotion ticket validation (vérificateur)
- [x] Payment webhooks (pawaPay)

### Phase 3 📅 PLANNED
- [ ] Real-time notifications (WebSocket)
- [ ] 2FA authentication
- [ ] Subscription system
- [ ] Advanced analytics dashboard
- [ ] Mobile app

## Monitoring

### Error Tracking
- Sentry (optional): [SECURITY.md](SECURITY.md#monitoring--logging)
- Local logs: `backend/storage/logs/`
- Render logs: dashboard service logs

### Performance
- Frontend: Vercel Analytics
- Backend: Laravel Query Log

## Contributing

1. Create feature branch: `git checkout -b feat/my-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feat/my-feature`
4. Open Pull Request
5. Wait for CI/CD + review

## License

MIT © 2026 Green Express. See [LICENSE](LICENSE).

## Support

For issues, questions, or suggestions:
- 📧 Email: support@greenexpress.com
- 🐛 GitHub Issues: Report bugs
- 💬 Discussions: Ask questions

## Changelog

### v1.0.0 (Feb 18, 2026)
- Initial release
- 6 role-based dashboards
- Promotion system with atomic claims
- Image uploads to Cloudinary
- Laravel Sanctum session authentication
- Rate limiting & security

---

**Last Updated:** February 18, 2026  
**Maintainers:** DevTeam  
**Status:** Beta 🚀
