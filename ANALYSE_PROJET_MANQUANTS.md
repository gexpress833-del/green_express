# 📋 Analyse du projet Green Express – Éléments manquants

**Date :** 18 février 2026  
**Objectif :** Identifier ce qui manque dans le projet (config, tests, doc, sécurité, déploiement).

---

## 1. Configuration et environnement

### 1.1 Backend – `.env.example` incomplet
- **Problème :** Le fichier `backend/.env.example` ne contient pas les variables nécessaires à l’app.
- **Manquant :** JWT (`JWT_SECRET`, `JWT_TTL`, etc.), Cloudinary, Shwary, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, option SQLite.
- **Référence :** La config complète est dans `backend/ENV_CONFIG.md` mais pas dans `.env.example`.
- **Action :** Aligner `.env.example` sur `ENV_CONFIG.md` (ou y ajouter un lien vers ce fichier) pour que `cp .env.example .env` suffise en dev.

### 1.2 Frontend – pas de `.env.local.example`
- **Problème :** Le README et `frontend-next/ENV_CONFIG.md` indiquent `copy .env.local.example .env.local`, mais le fichier `.env.local.example` n’existe pas.
- **Action :** Créer `frontend-next/.env.local.example` avec au minimum :
  - `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api`
  - Variables optionnelles (Cloudinary, Blob) commentées ou vides.

---

## 2. Tests

### 2.1 Backend – Factories manquantes
- **Problème :** `tests/Feature/PromotionClaimTest.php` utilise `Menu::factory()` et `Promotion::factory()`, mais seules `UserFactory` et le trait `HasFactory` sur `User` existent. Les modèles `Menu` et `Promotion` n’utilisent pas `HasFactory` et n’ont pas de Factory.
- **Conséquence :** `php artisan test` (ou `php artisan test tests/Feature/PromotionClaimTest.php`) échoue.
- **Action :**
  1. Ajouter `use HasFactory;` dans `App\Models\Menu` et `App\Models\Promotion`.
  2. Créer `database/factories/MenuFactory.php` et `database/factories/PromotionFactory.php` avec des états cohérents (dates, `menu_id`, etc.).

### 2.2 Backend – Couverture de tests limitée
- **Présent :** `Feature/PromotionClaimTest.php`, `Feature/ExampleTest.php`, `Unit/ExampleTest.php`.
- **Manquant :** Tests Feature/Unit pour Auth, Orders, Menus, Subscriptions, Payments, Livreur, Verificateur, Entreprise, Admin stats, Upload. Pas de tests pour les Form Requests si vous en ajoutez plus tard.
- **Recommandation :** Ajouter au moins des tests Feature pour les flux critiques : login, création de commande, création de menu (cuisinier), claim promotion (déjà fait), webhooks paiement (mock).

### 2.3 Frontend – Playwright absent
- **Problème :** Le README indique `npx playwright test` pour le frontend, mais `frontend-next/package.json` ne contient pas Playwright. Aucun script ni dossier de tests E2E visibles.
- **Action :** Soit ajouter Playwright (et un premier scénario, ex. login + liste promotions), soit retirer la section Playwright du README et documenter les tests manuels / autres outils (ex. Jest pour composants).

---

## 3. Validation et structure HTTP (backend)

### 3.1 Pas de Form Request dédiés
- **Constat :** Aucun fichier dans `app/Http/Requests/` ; la validation est faite dans les contrôleurs (ex. `$request->validate(...)`).
- **Impact :** Code plus difficile à réutiliser et à tester ; règles de validation éparpillées.
- **Recommandation (optionnel) :** Introduire des Form Requests pour les actions sensibles (ex. `StoreOrderRequest`, `StoreMenuRequest`, `ClaimPromotionRequest`) et les utiliser dans les contrôleurs.

### 3.2 Policies limitées
- **Présent :** `UserPolicy` uniquement, enregistrée via `Gate::policy(User::class, UserPolicy::class)`.
- **Manquant :** Pas de policies pour Menu, Order, Promotion, Subscription, etc. Les contrôles d’accès reposent surtout sur le middleware `role:`.
- **Recommandation :** Pour une autorisation plus fine (ex. “un cuisinier ne peut modifier que ses menus”), ajouter des policies (ex. `MenuPolicy`) et les utiliser dans les contrôleurs ou via `authorize()`.

---

## 4. Documentation et dépôt

### 4.1 Pas de dépôt Git au niveau projet
- **Constat :** Le workspace n’est pas un dépôt Git (pas de `.git` à la racine).
- **Impact :** Pas d’historique, pas de branches, pas d’intégration CI/CD basée sur Git.
- **Action :** Initialiser un dépôt (`git init`), ajouter un `.gitignore` adapté (backend + frontend), faire un premier commit. Si vous utilisez GitHub/GitLab, documenter l’URL dans le README.

### 4.2 Fichier LICENSE manquant
- **Problème :** Le README indique “MIT © 2026 Green Express” et un badge “license-MIT-blue” pointant vers `LICENSE`, mais il n’y a pas de fichier `LICENSE` à la racine.
- **Action :** Ajouter un fichier `LICENSE` avec le texte officiel de la licence MIT (ou la licence choisie).

### 4.3 Documentation API
- **Constat :** Aucune spécification OpenAPI/Swagger trouvée dans le projet. Les endpoints sont décrits dans le README en texte.
- **Recommandation :** Pour faciliter l’onboarding et l’intégration, ajouter une spec OpenAPI (YAML/JSON) ou un outil comme L5-Swagger / Scramble pour générer une doc API à partir du code Laravel.

---

## 5. CI/CD et qualité

### 5.1 Pas de pipeline CI/CD
- **Constat :** Aucun fichier dans `.github/workflows/` (ou équivalent GitLab/Jenkins) à la racine du projet. Le README “Contributing” mentionne “Wait for CI/CD + review” alors qu’aucun pipeline n’est défini.
- **Action :** Ajouter au moins un workflow (ex. GitHub Actions) qui :
  - Backend : `composer install`, `php artisan test`, éventuellement `phpcs`/PHPStan.
  - Frontend : `npm ci`, `npm run build`, `npm run lint` (et Playwright si vous l’ajoutez).
  - Optionnel : déploiement automatique (staging/prod) selon la branche.

### 5.2 Linting / analyse statique
- **Constat :** Pas de configuration visible pour PHP (PHP_CodeSniffer, PHPStan, Larastan) à la racine ou dans `backend/`. Le frontend a `npm run lint` (Next.js).
- **Recommandation :** Ajouter une config PHP (ex. `phpcs.xml` ou `phpstan.neon`) et l’exécuter en CI.

---

## 6. Déploiement et conteneurisation

### 6.1 Pas de Docker
- **Constat :** Aucun `Dockerfile` ou `docker-compose.yml` à la racine du projet. Le déploiement est décrit manuellement (PHP, Node, DB, etc.) dans `DEPLOYMENT.md`.
- **Impact :** Environnement de dev et de prod plus difficile à reproduire à l’identique.
- **Recommandation (optionnel) :** Fournir un `docker-compose.yml` (backend Laravel, frontend Next, SQLite/PostgreSQL, éventuellement Redis) pour dev local et pour des démos.

---

## 7. Sécurité et bonnes pratiques

### 7.1 Déjà en place (positif)
- JWT, middleware par rôle, rate limiting, validation, CORS, transactions pour les claims, upload limité (taille, MIME). Voir `SECURITY.md`.

### 7.2 À vérifier / renforcer
- **Secrets dans le code :** Vérifier qu’aucune clé API (Cloudinary, Shwary, JWT) n’est en dur dans le code ; tout doit passer par `.env`.
- **`.env` et `.env.local` :** S’assurer qu’ils sont bien dans `.gitignore` (Laravel et Next le font par défaut ; à confirmer à la racine si vous versionnez backend + frontend ensemble).
- **Webhooks :** `payments/webhook` et `shwary/callback` sont en POST public ; s’assurer que la vérification de signature (ex. `PAYMENT_WEBHOOK_SECRET`, Shwary) est bien implémentée et testée.

---

## 8. Alignement README / code (Roadmap)

- **README – Phase 2 :** Indique “Order system”, “Delivery assignment”, “Promotion ticket validation”, “Payment webhooks (Shwary)” comme “IN PROGRESS” ou non cochés.
- **Code :** Les contrôleurs et routes existent (OrderController, ShwaryController, LivreurController `validateCode`, VerificateurController `validatePromotionTicket`, etc.). Une partie de la Phase 2 est donc déjà implémentée.
- **Action :** Mettre à jour le README (roadmap / Phase 2) pour refléter ce qui est réellement livré (ex. cocher “Order system”, “Payment webhooks”, “Promotion ticket validation”, “Delivery assignment” si c’est le cas), et détailler éventuellement ce qui reste à faire (ex. notifications, 2FA).

---

## 9. Récapitulatif des actions prioritaires

| Priorité | Élément manquant | Action recommandée |
|----------|------------------|--------------------|
| **Haute** | Tests backend PromotionClaimTest cassés | Ajouter `HasFactory` + `MenuFactory` et `PromotionFactory` |
| **Haute** | `.env.example` backend incomplet | Compléter avec JWT, Cloudinary, Shwary, CORS (ou pointer vers ENV_CONFIG.md) |
| **Haute** | Pas de `.env.local.example` frontend | Créer le fichier avec `NEXT_PUBLIC_API_BASE` et variables optionnelles |
| **Moyenne** | Pas de dépôt Git | `git init`, `.gitignore`, premier commit |
| **Moyenne** | Fichier LICENSE manquant | Ajouter `LICENSE` (MIT ou autre) |
| **Moyenne** | README mentionne Playwright mais pas installé | Installer Playwright + 1 test E2E ou retirer la mention du README |
| **Moyenne** | Pas de CI/CD | Ajouter un workflow GitHub Actions (tests backend + frontend) |
| **Basse** | Pas de Form Requests | Introduire des Form Requests pour les flux principaux |
| **Basse** | Peu de policies | Ajouter des policies pour Menu / Order / Promotion si besoin de règles fines |
| **Basse** | Pas de doc API (OpenAPI/Swagger) | Ajouter une spec ou un générateur (L5-Swagger, Scramble) |
| **Basse** | Pas de Docker | Optionnel : ajouter `docker-compose` pour dev/démo |
| **Basse** | Roadmap README | Mettre à jour Phase 2 selon l’état réel du code |

---

## 10. Conclusion

Le projet est déjà avancé (backend Laravel, frontend Next.js, rôles, promotions, commandes, paiements Shwary, Filament, etc.). Les principaux manques concernent :

1. **Config et onboarding :** `.env.example` backend complet, `.env.local.example` frontend.
2. **Tests :** Factories Menu/Promotion + HasFactory pour que les tests existants passent ; extension des tests backend ; clarification ou ajout des tests frontend (Playwright).
3. **Projet et doc :** Git, LICENSE, mise à jour du README (roadmap, Playwright).
4. **CI/CD et qualité :** Pipeline (tests + lint), optionnellement analyse statique PHP et Docker.

En traitant les points “Haute” et “Moyenne” en priorité, le projet sera plus facile à faire tourner en local, à tester et à faire évoluer en équipe.
