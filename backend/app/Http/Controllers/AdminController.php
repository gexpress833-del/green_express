<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Menu;
use App\Models\Subscription;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\DeliveryLog;
use App\Models\User;
use App\Http\Traits\RoleAccess;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminController extends Controller
{
    use RoleAccess;

    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            $ordersCount = Order::count();
            $revenue = (float) Order::sum('total_amount');
            $subscriptionsCount = Subscription::count();
            $menusCount = Menu::count();
            $pendingMenus = Menu::where('status', 'pending')->count();
            $companiesCount = Company::count();
            $companiesPending = Company::where('status', 'pending')->count();
            $companySubscriptionsCount = CompanySubscription::count();
            $companySubscriptionsPending = CompanySubscription::where('status', 'pending')->count();
            $deliveriesPending = DeliveryLog::where('status', 'pending')->count();

            return response()->json([
                'orders' => $ordersCount,
                'revenue' => $revenue,
                'revenue_currency' => 'USD',
                'subscriptions' => $subscriptionsCount,
                'menus' => $menusCount,
                'pending_menus' => $pendingMenus,
                'companies' => $companiesCount,
                'companies_pending' => $companiesPending,
                'company_subscriptions' => $companySubscriptionsCount,
                'company_subscriptions_pending' => $companySubscriptionsPending,
                'deliveries_pending' => $deliveriesPending,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Export PDF des statistiques admin.
     */
    public function statsPdf(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé. Rôle admin requis.'], 403);
        }

        $ordersCount = Order::count();
        $revenue = (float) Order::sum('total_amount');
        $subscriptionsCount = Subscription::count();
        $menusCount = Menu::count();
        $pendingMenus = Menu::where('status', 'pending')->count();
        $companiesCount = Company::count();
        $companiesPending = Company::where('status', 'pending')->count();
        $companySubscriptionsCount = CompanySubscription::count();
        $companySubscriptionsPending = CompanySubscription::where('status', 'pending')->count();
        $deliveriesPending = DeliveryLog::where('status', 'pending')->count();

        $stats = [
            ['Commandes', (string) $ordersCount],
            ['Chiffre d\'affaires (USD)', number_format($revenue, 2, ',', ' ')],
            ['Abonnements (clients)', (string) $subscriptionsCount],
            ['Menus', (string) $menusCount . ' (' . $pendingMenus . ' en attente)'],
            ['Entreprises B2B', (string) $companiesCount . ' (' . $companiesPending . ' en attente)'],
            ['Abonnements B2B', (string) $companySubscriptionsCount . ' (' . $companySubscriptionsPending . ' en attente)'],
            ['Livraisons en attente', (string) $deliveriesPending],
        ];

        $html = view('admin.stats-pdf', [
            'stats' => $stats,
            'generatedAt' => now()->format('d/m/Y H:i'),
        ])->render();

        $pdf = Pdf::loadHTML($html);
        return $pdf->stream('statistiques-admin.pdf', ['Attachment' => true]);
    }

    /**
     * Liste des livraisons (admin) — toutes entreprises, pour suivi et marquage
     */
    public function deliveries(Request $request)
    {
        $this->requireRole('admin');

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $deliveries = DeliveryLog::with(['company:id,name', 'mealPlan.employee', 'mealPlan.meal'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date, fn($q) => $q->whereDate('delivery_date', $request->date))
            ->orderByDesc('delivery_date')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $deliveries,
        ]);
    }

    /**
     * Liste des rôles disponibles et effectifs par rôle (admin)
     */
    public function roles(Request $request)
    {
        $this->requireRole('admin');

        $roles = [
            ['id' => 'admin', 'label' => 'Administrateur', 'description' => 'Accès complet au back-office'],
            ['id' => 'client', 'label' => 'Client', 'description' => 'Commandes et abonnements particuliers'],
            ['id' => 'entreprise', 'label' => 'Entreprise (B2B)', 'description' => 'Portail entreprise, abonnements et agents'],
            ['id' => 'cuisinier', 'label' => 'Cuisinier', 'description' => 'Gestion des menus et plats'],
            ['id' => 'livreur', 'label' => 'Livreur', 'description' => 'Suivi des livraisons'],
            ['id' => 'verificateur', 'label' => 'Verificateur', 'description' => 'Validation des commandes / livraisons'],
            ['id' => 'agent', 'label' => 'Agent', 'description' => 'Employé entreprise (accès limité)'],
        ];

        $counts = User::selectRaw('role, COUNT(*) as count')->groupBy('role')->pluck('count', 'role');

        foreach ($roles as &$r) {
            $r['count'] = (int) ($counts[$r['id']] ?? 0);
        }

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }
}
