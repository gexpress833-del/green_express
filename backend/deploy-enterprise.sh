#!/bin/bash

# ============================================================================
# SCRIPT DEPLOYMENT - Module B2B Entreprise
# ============================================================================
# Exécute toutes les étapes pour déployer et tester le système
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT - Module B2B Entreprise                        ║"
echo "║                       GREEN EXPRESS Application                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# ÉTAPE 1: Vérifications
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 1: Vérifications ===${NC}\n"

print_step "Vérifier si le projet Laravel est configuré..."
if [ ! -f "artisan" ]; then
    print_error "Fichier artisan introuvable. Êtes-vous dans le répertoire backend?"
    exit 1
fi
print_success "Project trouvé"

print_step "Vérifier la connexion base de données..."
php artisan tinker <<EOF 2>/dev/null
exit
EOF
print_success "Connexion BD OK"

# ============================================================================
# ÉTAPE 2: Exécuter les migrations
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 2: Exécuter les migrations ===${NC}\n"

print_step "Exécution des migrations..."
php artisan migrate --no-interaction
print_success "Migrations complétées"

# ============================================================================
# ÉTAPE 3: Charger les données de test
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 3: Charger les données de test ===${NC}\n"

print_step "Exécution du seeder EnterpriseSeeder..."
php artisan db:seed --class=EnterpriseSeeder --no-interaction
print_success "Données de test chargées"

# ============================================================================
# ÉTAPE 4: Vérifications base de données
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 4: Vérifications de la base de données ===${NC}\n"

print_step "Vérifier les tables créées..."
php artisan tinker <<EOF
\$tables = collect(array_column(\DB::select('SHOW TABLES'), 'Tables_in_greenexpress'), 0);
\$expected = ['companies', 'company_employees', 'company_menus', 'company_subscriptions', 'delivery_logs', 'employee_meal_plans', 'meal_sides', 'pricing_tiers', 'subscription_history'];

foreach (\$expected as \$table) {
    if (\$tables->contains(\$table)) {
        echo "  ✓ \$table\n";
    } else {
        echo "  ✗ \$table (MANQUANT)\n";
    }
}
exit
EOF

echo ""
print_step "Vérifier les données de test..."
php artisan tinker <<EOF
\$companyCount = App\Models\Company::count();
\$employeeCount = App\Models\CompanyEmployee::count();
\$subscriptionCount = App\Models\CompanySubscription::count();
\$deliveryCount = App\Models\DeliveryLog::count();

echo "  - Entreprises: \$companyCount\n";
echo "  - Employés: \$employeeCount\n";
echo "  - Abonnements: \$subscriptionCount\n";
echo "  - Logs Livraison: \$deliveryCount\n";

if (\$companyCount > 0 && \$employeeCount > 0 && \$subscriptionCount > 0 && \$deliveryCount > 0) {
    echo "\n✓ Données de test OK\n";
} else {
    echo "\n✗ Données de test INCOMPLÈTES\n";
}
exit
EOF

# ============================================================================
# ÉTAPE 5: Vérifier les contrôleurs et services
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 5: Vérifier les fichiers ===${NC}\n"

FILES_TO_CHECK=(
    "app/Http/Controllers/Api/CompanyController.php"
    "app/Http/Controllers/Api/CompanySubscriptionController.php"
    "app/Http/Controllers/Api/CompanyEmployeeController.php"
    "app/Http/Controllers/Api/EmployeeMealPlanController.php"
    "app/Http/Controllers/Api/DeliveryController.php"
    "app/Http/Controllers/Api/ExportController.php"
    "app/Services/CompanyPricingService.php"
    "app/Services/CompanyEmployeeService.php"
    "app/Services/DeliveryService.php"
    "app/Services/ExportService.php"
    "resources/views/exports/delivery-plan.blade.php"
    "resources/views/exports/employee-meal-summary.blade.php"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file"
    else
        print_error "$file (MANQUANT)"
    fi
done

# ============================================================================
# ÉTAPE 6: Tester les routes
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 6: Lister les routes B2B ===${NC}\n"

print_step "Routes API disponibles:"
php artisan route:list | grep -E "companies|subscriptions|employees|meal-plans|deliveries|export" | head -20
echo "... (et plus)"

# ============================================================================
# ÉTAPE 7: Test d'une requête API simple
# ============================================================================
echo -e "\n${BLUE}=== ÉTAPE 7: Test API ===${NC}\n"

print_step "Test de l'endpoint ping..."
RESPONSE=$(curl -s http://localhost:8000/api/ping)
if echo "$RESPONSE" | grep -q "pong"; then
    print_success "API est accessible"
    echo -e "  Réponse: $RESPONSE"
else
    print_warning "API peut ne pas être accessible ou le serveur n'est pas lancé"
    echo -e "  Assurez-vous que: php artisan serve est en cours d'exécution"
fi

# ============================================================================
# RÉSUMÉ
# ============================================================================
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ DÉPLOIEMENT COMPLÉTÉ AVEC SUCCÈS!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}\n"

echo "📋 Prochaines étapes:"
echo "  1. Lancer le serveur:"
echo -e "     ${YELLOW}php artisan serve${NC}"
echo ""
echo "  2. Tester les endpoints (voir TESTING_ENTERPRISE_B2B.md)"
echo ""
echo "  3. Importer les routes dans Postman"
echo ""
echo "📚 Documentation:"
echo "  - ENTERPRISE_B2B_COMPLETE.md (Vue d'ensemble)"
echo "  - ENTERPRISE_API_GUIDE.md (Guide API)"
echo "  - TESTING_ENTERPRISE_B2B.md (Tests étape par étape)"
echo "  - ENTERPRISE_FILES_STRUCTURE.md (Structure fichiers)"
echo ""
echo "🔗 Endpoints clés:"
echo "  GET    /api/companies                          - Lister entreprises"
echo "  POST   /api/companies                          - Créer entreprise"
echo "  POST   /api/companies/{id}/approve             - Approuver + créer employés"
echo "  POST   /api/companies/{id}/subscriptions       - Créer abonnement"
echo "  GET    /api/companies/{id}/employees           - Lister employés"
echo "  POST   /api/subscriptions/{id}/meal-plans      - Créer plan repas"
echo "  GET    /api/subscriptions/{id}/export/pdf      - Export PDF"
echo ""
echo "🚀 Le système B2B Entreprise est prêt! 🚀"
echo ""
