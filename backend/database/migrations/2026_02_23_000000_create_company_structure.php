<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // TABLE: Companies (Entreprises)
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique(); // For email generation
            $table->string('siret')->unique()->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->enum('institution_type', ['etat', 'hopital', 'ecole', 'universite', 'privee']);
            $table->integer('employee_count'); // Nombre exact d'agents
            $table->enum('status', ['pending', 'active', 'suspended', 'ended'])->default('pending');
            $table->unsignedBigInteger('contact_user_id')->nullable(); // Responsable entreprise
            $table->decimal('monthly_budget', 12, 2)->nullable();
            $table->timestamps();
            $table->foreign('contact_user_id')->references('id')->on('users')->onDelete('set null');
        });

        // TABLE: Pricing Tiers (Tarifs dynamiques par admin)
        Schema::create('pricing_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('plan_name'); // "Bronze", "Silver", "Gold", "Platinum"
            $table->integer('min_employees');
            $table->integer('max_employees');
            $table->decimal('price_per_meal_usd', 10, 2); // Prix base en USD
            $table->decimal('price_per_meal_cdf', 12, 2); // Prix en CDF
            $table->decimal('exchange_rate', 10, 4); // Taux change USD → CDF
            $table->string('currency', 3); // "USD" ou "CDF"
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // TABLE: Company Subscriptions (Abonnements mensuels)
        Schema::create('company_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('pricing_tier_id');
            $table->decimal('price_per_agent', 10, 2); // Prix sauvegardé au moment de la souscription
            $table->integer('agent_count'); // Nombre d'agents pour ce mois
            $table->decimal('total_monthly_price', 12, 2); // agent_count × price_per_agent
            $table->string('currency', 3); // "USD" ou "CDF"
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['pending', 'active', 'expired', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->integer('meals_provided')->default(0); // Nombre de repas déjà livrés
            $table->integer('meals_remaining')->nullable(); // Nombre de repas restants
            $table->timestamps();
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('pricing_tier_id')->references('id')->on('pricing_tiers')->onDelete('restrict');
        });

        // TABLE: Company Employees (Agents de l'entreprise)
        Schema::create('company_employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('full_name');
            $table->enum('function', ['directeur', 'manager', 'employ', 'stagiaire', 'autre']);
            $table->string('matricule'); // Unique par entreprise
            $table->string('phone');
            $table->string('email')->unique(); // Auto-generée: {matricule}@{company_slug}.greenexpress.com
            $table->string('password');
            $table->enum('account_status', ['pending', 'active', 'inactive'])->default('pending');
            $table->unsignedBigInteger('current_subscription_id')->nullable(); // Subscription actuelle
            $table->timestamps();
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('current_subscription_id')->references('id')->on('company_subscriptions')->onDelete('set null');
            $table->unique(['company_id', 'matricule']); // Matricule unique par entreprise
        });

        // TABLE: Company Menus (Menu par plan d'abonnement)
        Schema::create('company_menus', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pricing_tier_id');
            $table->string('name'); // "Plat du jour"
            $table->text('description')->nullable();
            $table->string('meal_type'); // "plat_principal"
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('pricing_tier_id')->references('id')->on('pricing_tiers')->onDelete('cascade');
        });

        // TABLE: Meal Sides (Accompagnements)
        Schema::create('meal_sides', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_menu_id');
            $table->string('name'); // "Riz", "Frites", "Salade"
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('company_menu_id')->references('id')->on('company_menus')->onDelete('cascade');
        });

        // TABLE: Employee Meal Plans (Choix de repas pour 4 semaines)
        Schema::create('employee_meal_plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_employee_id');
            $table->unsignedBigInteger('subscription_id');
            $table->unsignedBigInteger('meal_id'); // Le plat choisi
            $table->unsignedBigInteger('side_id'); // L'accompagnement choisi
            $table->date('valid_from'); // Début de la période 4 semaines
            $table->date('valid_until'); // Fin de la période 4 semaines
            $table->enum('status', ['draft', 'confirmed', 'partial_delivered', 'completed'])->default('draft');
            $table->integer('meals_delivered')->default(0); // Nombre de repas délivrés
            $table->integer('meals_remaining')->default(20); // 5 jours × 4 semaines = 20 repas
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            $table->foreign('company_employee_id')->references('id')->on('company_employees')->onDelete('cascade');
            $table->foreign('subscription_id')->references('id')->on('company_subscriptions')->onDelete('cascade');
            $table->foreign('meal_id')->references('id')->on('company_menus')->onDelete('restrict');
            $table->foreign('side_id')->references('id')->on('meal_sides')->onDelete('restrict');
        });

        // TABLE: Delivery Logs (Historique de livraisons)
        Schema::create('delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meal_plan_id');
            $table->unsignedBigInteger('company_id');
            $table->date('delivery_date');
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
            $table->integer('quantity_delivered')->default(1);
            $table->enum('status', ['pending', 'delivered', 'failed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->foreign('meal_plan_id')->references('id')->on('employee_meal_plans')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });

        // TABLE: Subscription History (Historique des abonnements pour traçabilité)
        Schema::create('subscription_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subscription_id');
            $table->unsignedBigInteger('company_id');
            $table->enum('action', ['created', 'activated', 'renewed', 'upgraded', 'downgraded', 'expired', 'cancelled']);
            $table->integer('agent_count_before')->nullable();
            $table->integer('agent_count_after')->nullable();
            $table->decimal('price_before', 12, 2)->nullable();
            $table->decimal('price_after', 12, 2)->nullable();
            $table->text('details')->nullable();
            $table->unsignedBigInteger('performed_by')->nullable(); // Admin ID
            $table->timestamps();
            $table->foreign('subscription_id')->references('id')->on('company_subscriptions')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('performed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_history');
        Schema::dropIfExists('delivery_logs');
        Schema::dropIfExists('employee_meal_plans');
        Schema::dropIfExists('meal_sides');
        Schema::dropIfExists('company_menus');
        Schema::dropIfExists('company_employees');
        Schema::dropIfExists('company_subscriptions');
        Schema::dropIfExists('pricing_tiers');
        Schema::dropIfExists('companies');
    }
};
