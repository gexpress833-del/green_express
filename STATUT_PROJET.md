# Green Express – État du projet (ce qui est en place / ce qui reste à faire)

**Date de vérification :** 9 mars 2026

---

## ✅ DÉJÀ EN PLACE

### Backend (Laravel)
- **Framework** : Laravel 12, PHP 8.2
- **Base de données** : MySQL configurée (`.env` : `db_gexpress`), migrations en place
- **Authentification** : Sanctum (`auth:api`) – login, register, logout, `/me`, cookies/session
- **Rôles** : 6 rôles (admin, cuisinier, client, livreur, verificateur, entreprise) avec middlewares et contrôleurs dédiés
- **API** : Menus, promotions (claim atomique), commandes, paiements pawaPay, abonnements, entreprises, employés, livraisons, stats par rôle, etc.
- **Cloudinary** : Upload, suppression, transformation d’images ; config, validation (type, taille), rate limiting
- **Sécurité** : CORS, rate limiting, validation des entrées, transactions pour les claims
- **Config** : `.env.example` complet (Cloudinary, pawaPay, CORS, Sanctum, DB)
- **Tests** : PHPUnit (ex. CloudinaryUploadTest), factories `User`, `Menu`, `Promotion` + `HasFactory` sur les modèles
- **Documentation API** : `docs/API.md` + `docs/openapi.yaml`

### Frontend (Next.js)
- **Stack** : Next.js 13 (App Router), React 18, Tailwind CSS
- **Config** : `.env.local.example` avec `NEXT_PUBLIC_API_URL`
- **Fonctionnalités** : Dashboards par rôle, menus (création avec upload image), promotions (liste, claim), toasts, états de chargement
- **Tests** : Playwright présent dans `package.json` (`test:e2e`, `@playwright/test`)

### Projet / Doc
- **LICENSE** : Fichier MIT présent
- **CI/CD** : Workflow GitHub Actions dans `.github/workflows/ci-cd.yml` (backend tests, frontend build)
- **Docs** : README, DEPLOYMENT, SECURITY, TEST_GUIDE, PRODUCTION_READINESS, FINAL_CHECKLIST, guides RBAC, etc.
- **Roadmap README** : Phase 1 et Phase 2 marquées comme faites (commandes, livraison, validation tickets, webhooks pawaPay)

---

## ❌ CE QUI RESTE À FAIRE (ou à finaliser)

### Priorité haute
1. **Dépôt Git**  
   Le dossier `c:\SERVICE` n’est **pas** un dépôt Git (pas de `.git`).  
   À faire : `git init`, `.gitignore` adapté (déjà présent à la racine), premier commit. Indiquer l’URL du dépôt (GitHub/GitLab) dans le README si besoin.

### Priorité moyenne (avant / pour la production)
2. **SSL/TLS** : Certificat pour la production (non configuré).
3. **Backups base de données** : Automatisation non documentée/mise en place.
4. **Monitoring** : Sentry (erreurs), DataDog/New Relic (perf), agrégation de logs, surveillance de disponibilité – non déployés.
5. **Environnement de staging** : Non décrit comme déployé.
6. **Tests de charge** : Non effectués.
7. **Audit de sécurité** : Non réalisé.
8. **Plan de reprise / incident** : Non documenté ou non testé.
9. **Playwright E2E** : Dépendance présente mais scénarios E2E complets (login, création menu, etc.) à confirmer / compléter (voir `PRODUCTION_READINESS.md`).

### Priorité basse / optionnel
10. **Form Requests** : Pas de Form Requests dédiés ; la validation est dans les contrôleurs (amélioration possible).
11. **Policies** : Seule `UserPolicy` est mentionnée ; pas de policies pour Menu, Order, Promotion (autorisation fine optionnelle).
12. **Docker** : Pas de `Dockerfile` ni `docker-compose` (déploiement manuel décrit dans DEPLOYMENT.md).
13. **Lint / analyse statique PHP** : Pas de config PHP_CodeSniffer / PHPStan visible en CI (le workflow peut être étendu).
14. **Phase 3 (roadmap)** : Notifications temps réel (WebSocket), 2FA, abonnements avancés, analytics, app mobile – non implémentés.

### Points de vigilance
- **Webhooks** : `payments/webhook` et `pawapay/callback` sont en POST public ; s’assurer que la validation d’intégrité et les secrets éventuels sont cohérents en production.
- **Secrets** : Vérifier qu’aucune clé (Cloudinary, pawaPay, etc.) n’est en dur dans le code et que `.env` / `.env.local` sont bien ignorés par Git.
- **Base de données** : En production, prévoir PostgreSQL ou MySQL (au lieu de SQLite si encore utilisé en dev) et stratégie de sauvegarde.

---

## 📋 RÉCAPITULATIF

| Catégorie              | En place                         | Reste à faire / à finaliser        |
|------------------------|----------------------------------|------------------------------------|
| Backend / API          | ✅ Complet (auth, rôles, menus, commandes, pawaPay, Cloudinary, tests) | Lint PHP, Form Requests (optionnel) |
| Frontend               | ✅ Complet (dashboards, menus, promotions, upload) | Scénarios Playwright E2E complets  |
| Config / env           | ✅ `.env.example` backend, `.env.local.example` frontend | —                                   |
| Tests                  | ✅ PHPUnit, factories, CI backend + build frontend | E2E Playwright, load tests         |
| Documentation          | ✅ README, API, déploiement, sécurité, checklist | —                                   |
| Git / CI               | ✅ Workflow GitHub Actions       | ❌ Dépôt Git non initialisé         |
| Licence                | ✅ LICENSE MIT                   | —                                   |
| Production / Ops       | Partiel (checklist prête)        | SSL, backups, monitoring, staging, audit sécu, plan incident |

En résumé : le cœur applicatif (backend + frontend + intégrations) est en place et documenté. Les principaux manques sont l’**initialisation du dépôt Git** et, pour la mise en production, les éléments **infra / ops** (SSL, backups, monitoring, staging, audits).
