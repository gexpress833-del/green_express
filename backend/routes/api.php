<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SubscriptionPlanController;

use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\InvoiceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Racine API (GET /api ou /api/) — pour vérifier que l'API répond
Route::get('/', function () {
    return response()->json([
        'name' => 'Green Express API',
        'status' => 'ok',
        'endpoints' => ['/api/ping', '/api/login', '/api/register', '/api/menus/public/browse'],
    ]);
});
Route::get('ping', function() {
    return response()->json(['message' => 'pong']);
});

Route::post('register', [AuthController::class, 'register'])->middleware('throttle:api');
Route::post('register-company', [AuthController::class, 'registerCompany'])->middleware('throttle:api');
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:api')->name('login');
// GET /api/login : évite MethodNotAllowed quand on ouvre l'URL dans le navigateur
Route::get('login', function () {
    return response()->json([
        'message' => 'Use POST to log in. Open the frontend app (e.g. http://localhost:3000/login) to sign in.',
        'method' => 'POST',
        'allowed' => ['POST'],
    ], 405);
});

// Webhook paiement (public, sécurisé par signature provider)
Route::post('payments/webhook', [PaymentController::class, 'webhook']);

// Webhook Shwary (public, protégé par signature si nécessaire)
Route::post('shwary/callback', [\App\Http\Controllers\ShwaryController::class, 'callback']);

// Promotions (public - visibles par tous)
Route::get('promotions', [PromotionController::class, 'index']);

// Plans d'abonnement (public, pour page d'accueil)
Route::get('subscription-plans/public', [SubscriptionPlanController::class, 'publicIndex'])->middleware('throttle:api');

// Menus publics (sans auth - pour prévisualisation, page d'accueil, etc.)
Route::get('menus/public/recent', [MenuController::class, 'publicRecent'])->middleware('throttle:api');
Route::get('menus/public/browse', [MenuController::class, 'browse'])->middleware('throttle:api');
Route::post('promotions/{id}/claim', [PromotionController::class, 'claim'])->middleware('throttle:api'); // Auth check done manually in controller
Route::post('promotions', [PromotionController::class, 'store'])->middleware('auth:api', 'throttle:api');
Route::get('my-promotion-claims', [PromotionController::class, 'myClaims'])->middleware('throttle:api'); // Auth check done manually
Route::get('promotions/{id}', [PromotionController::class, 'show']);
Route::put('promotions/{id}', [PromotionController::class, 'update'])->middleware('auth:api', 'throttle:api');
Route::delete('promotions/{id}', [PromotionController::class, 'destroy'])->middleware('auth:api', 'throttle:api');

// Types d'événements (public - pour le formulaire)
Route::get('event-types', [\App\Http\Controllers\Api\EventTypeController::class, 'index'])->middleware('throttle:api');

// Types d'événements - admin (CRUD complet)
Route::middleware(['auth:api'])->group(function () {
    Route::get('event-types/{id}', [\App\Http\Controllers\Api\EventTypeController::class, 'show']);
    Route::post('event-types', [\App\Http\Controllers\Api\EventTypeController::class, 'store'])->middleware('throttle:api');
    Route::put('event-types/{id}', [\App\Http\Controllers\Api\EventTypeController::class, 'update'])->middleware('throttle:api');
    Route::delete('event-types/{id}', [\App\Http\Controllers\Api\EventTypeController::class, 'destroy'])->middleware('throttle:api');
});

// --- Authentification Sanctum (session + cookies) ---
// GET /api/user et /api/me : publics pour éviter 401 en console (réponse 200 + null si non connecté)
Route::get('user', [AuthController::class, 'user'])->middleware('throttle:api');
Route::get('me', [AuthController::class, 'me'])->middleware('throttle:api');
Route::middleware(['auth:api', 'throttle:api'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, '__invoke']);
});

// --- Toutes les routes ci-dessous requièrent auth:api (session) ---
Route::middleware(['auth:api'])->group(function () {

// Demandes événementielles (client connecté obligatoire)
Route::post('event-requests', [\App\Http\Controllers\EventRequestController::class, 'store'])->middleware('throttle:api');
Route::get('my-event-requests', [\App\Http\Controllers\EventRequestController::class, 'myRequests'])->middleware('throttle:api');

// Profil utilisateur
Route::put('profile', [ProfileController::class, 'update'])->middleware('throttle:api');
Route::put('profile/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:api');

// Notifications (DB)
Route::get('notifications', [NotificationController::class, 'index'])->middleware('throttle:api');
Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])->middleware('throttle:api');
Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->middleware('throttle:api');

// Agent Approvals (Entreprise crée, Admin valide)
Route::post('agents/request', [\App\Http\Controllers\AgentApprovalController::class, 'requestAgent'])->middleware('throttle:api');
Route::get('agents/requests', [\App\Http\Controllers\AgentApprovalController::class, 'listAgentRequests'])->middleware('throttle:api'); // Auth check in controller
Route::post('agent-approvals/{agentApproval}/approve', [\App\Http\Controllers\AgentApprovalController::class, 'approveAgent'])->middleware('throttle:api'); // Auth check in controller
Route::post('agent-approvals/{agentApproval}/reject', [\App\Http\Controllers\AgentApprovalController::class, 'rejectAgent'])->middleware('throttle:api'); // Auth check in controller

// Upload endpoints (authentifié)
Route::post('upload-image', [\App\Http\Controllers\UploadController::class, 'uploadImage'])->middleware('throttle:api'); // Auth check manually
Route::delete('upload-image', [\App\Http\Controllers\UploadController::class, 'deleteImage'])->middleware('throttle:api'); // Auth check manually
Route::get('upload/config', [\App\Http\Controllers\UploadController::class, 'checkConfig'])->middleware('throttle:api'); // Auth check manually
Route::get('upload-image/transform', [\App\Http\Controllers\UploadController::class, 'getTransformed'])->middleware('throttle:api'); // Auth check manually

// Menus
Route::post('menus', [MenuController::class, 'store'])->middleware('throttle:api'); // Auth + role check manually
Route::get('my-menus', [MenuController::class, 'index'])->middleware('throttle:api'); // Auth + role check manually
Route::get('menus/browse', [MenuController::class, 'browse'])->middleware('throttle:api'); // Auth check manually
Route::get('menus', [MenuController::class, 'index'])->middleware('throttle:api'); // Auth + role check manually
Route::get('menus/{menu}', [MenuController::class, 'show'])->middleware('throttle:api'); // Auth + role check manually
Route::put('menus/{menu}', [MenuController::class, 'update'])->middleware('throttle:api'); // Auth + role check manually
Route::delete('menus/{menu}', [MenuController::class, 'destroy'])->middleware('throttle:api'); // Auth + role check manually

// Factures client (liste des factures du user connecté)
Route::get('invoices', [InvoiceController::class, 'index'])->middleware('throttle:api');

// Orders
Route::get('orders', [OrderController::class, 'index'])->middleware('throttle:api'); // Auth check manually
Route::get('orders/{id}', [OrderController::class, 'show'])->middleware('throttle:api');
Route::patch('orders/{id}', [OrderController::class, 'update'])->middleware('throttle:api');
Route::delete('orders/{id}', [OrderController::class, 'destroy'])->middleware('throttle:api');
Route::get('orders/{id}/pdf', [OrderController::class, 'pdf'])->middleware('throttle:api');
Route::post('orders', [OrderController::class, 'store'])->middleware('throttle:api'); // Auth check manually
Route::post('orders/{id}/initiate-payment', [OrderController::class, 'initiatePayment'])->middleware('throttle:api'); // Auth check manually
Route::post('orders/{id}/confirm-payment', [OrderController::class, 'confirmPayment'])->middleware('throttle:api'); // Auth check manually
Route::post('orders/{uuid}/validate-code', [OrderController::class, 'validateCode'])->middleware('throttle:api'); // Auth check manually
Route::patch('orders/{id}/assign-livreur', [OrderController::class, 'assignLivreur'])->middleware('throttle:api');

// Plans d'abonnement (clients: actifs, admin: tous)
Route::get('subscription-plans', [SubscriptionPlanController::class, 'index'])->middleware('throttle:api');
Route::get('subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'show'])->middleware('throttle:api');
Route::post('admin/subscription-plans', [SubscriptionPlanController::class, 'store'])->middleware('throttle:api');
Route::put('admin/subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'update'])->middleware('throttle:api');
Route::delete('admin/subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'destroy'])->middleware('throttle:api');

// Abonnements clients (demande → pending, admin valide/rejette)
Route::get('subscriptions', [SubscriptionController::class, 'index'])->middleware('throttle:api');
Route::post('subscriptions', [SubscriptionController::class, 'store'])->middleware('throttle:api');
Route::post('subscriptions/{id}/initiate-payment', [SubscriptionController::class, 'initiatePayment'])->middleware('throttle:api');
Route::post('admin/subscriptions/validate/{id}', [SubscriptionController::class, 'validateSubscription'])->middleware('throttle:api');
Route::post('admin/subscriptions/reject/{id}', [SubscriptionController::class, 'rejectSubscription'])->middleware('throttle:api');
Route::post('admin/subscriptions/{id}/pause', [SubscriptionController::class, 'pauseSubscription'])->middleware('throttle:api');
Route::post('admin/subscriptions/{id}/resume', [SubscriptionController::class, 'resumeSubscription'])->middleware('throttle:api');
Route::post('admin/subscriptions/{id}/cancel', [SubscriptionController::class, 'cancelSubscription'])->middleware('throttle:api');
Route::post('admin/subscriptions', [SubscriptionController::class, 'storeForUser'])->middleware('throttle:api');

// Admin payments (list, stats, reconcile)
Route::get('admin/payments/stats', [PaymentController::class, 'stats'])->middleware('throttle:api');
Route::get('admin/payments', [PaymentController::class, 'index'])->middleware('throttle:api');
Route::post('admin/payments/reconcile', [PaymentController::class, 'reconcile'])->middleware('throttle:api');

// Reports (admin)
Route::get('reports', [ReportController::class, 'index'])->middleware('auth:api', 'throttle:api');
Route::post('reports/generate', [ReportController::class, 'generate'])->middleware('auth:api', 'throttle:api');
Route::get('reports/{id}/download', [ReportController::class, 'download'])->middleware('auth:api', 'throttle:api');
Route::delete('reports/{id}', [ReportController::class, 'destroy'])->middleware('auth:api', 'throttle:api');

// User management
Route::get('users', [\App\Http\Controllers\UserController::class, 'index'])->middleware('throttle:api'); // Auth + role:admin check manually
Route::post('users', [\App\Http\Controllers\UserController::class, 'store'])->middleware('throttle:api'); // Auth + role:admin check manually
Route::post('users/{user}/role', [\App\Http\Controllers\UserController::class, 'updateRole'])->middleware('throttle:api'); // Auth + role:admin check manually
Route::delete('users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->middleware('throttle:api'); // Auth + role:admin check manually

// Demandes événementielles (admin)
Route::get('admin/event-requests', [\App\Http\Controllers\EventRequestController::class, 'index'])->middleware('throttle:api');
Route::patch('admin/event-requests/{id}', [\App\Http\Controllers\EventRequestController::class, 'update'])->middleware('throttle:api');

// Stats by role (all require auth + role match check manually)
Route::get('admin/stats', [AdminController::class, 'stats'])->middleware('throttle:api');
Route::get('admin/stats/export-pdf', [AdminController::class, 'statsPdf'])->middleware('throttle:api');
Route::get('admin/deliveries', [AdminController::class, 'deliveries'])->middleware('throttle:api');
Route::get('admin/roles', [AdminController::class, 'roles'])->middleware('throttle:api');
Route::get('cuisinier/stats', [\App\Http\Controllers\CuisinierController::class, 'stats'])->middleware('throttle:api');
Route::get('client/stats', [\App\Http\Controllers\ClientController::class, 'stats'])->middleware('throttle:api');
Route::get('livreur/stats', [\App\Http\Controllers\LivreurController::class, 'stats'])->middleware('throttle:api');
Route::get('livreurs', [\App\Http\Controllers\LivreurController::class, 'listForAssignment'])->middleware('throttle:api');
Route::get('livreur/assignments', [\App\Http\Controllers\LivreurController::class, 'getAssignments'])->middleware('throttle:api');
Route::post('livreur/validate-code', [\App\Http\Controllers\LivreurController::class, 'validateDeliveryCode'])->middleware('throttle:api');
Route::get('verificateur/stats', [\App\Http\Controllers\VerificateurController::class, 'stats'])->middleware('throttle:api');
Route::get('verificateur/history', [\App\Http\Controllers\VerificateurController::class, 'history'])->middleware('throttle:api');
Route::post('verificateur/validate-ticket', [\App\Http\Controllers\VerificateurController::class, 'validatePromotionTicket'])->middleware('throttle:api');
Route::get('entreprise/stats', [\App\Http\Controllers\EntrepriseController::class, 'stats'])->middleware('throttle:api');
Route::get('entreprise/company', [\App\Http\Controllers\EntrepriseController::class, 'company'])->middleware('throttle:api');
Route::get('entreprise/orders', [\App\Http\Controllers\EntrepriseController::class, 'orders'])->middleware('throttle:api');
// B2B Enterprise Management (Company System)
// Abonnements entreprise — liste admin (activation / création)
Route::get('admin/company-subscriptions', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'adminIndex'])->middleware('throttle:api');

// Companies (admin only)
Route::get('companies', [\App\Http\Controllers\Api\CompanyController::class, 'index'])->middleware('throttle:api');
Route::post('companies', [\App\Http\Controllers\Api\CompanyController::class, 'store'])->middleware('throttle:api');
Route::get('companies/{company}', [\App\Http\Controllers\Api\CompanyController::class, 'show'])->middleware('throttle:api');
Route::get('companies/{company}/agents-pdf', [\App\Http\Controllers\Api\ExportController::class, 'companyAgentsPDF'])->middleware('throttle:api');
Route::put('companies/{company}', [\App\Http\Controllers\Api\CompanyController::class, 'update'])->middleware('throttle:api');
Route::post('companies/{company}/approve', [\App\Http\Controllers\Api\CompanyController::class, 'approve'])->middleware('throttle:api');
Route::post('companies/{company}/reject', [\App\Http\Controllers\Api\CompanyController::class, 'reject'])->middleware('throttle:api');
Route::delete('companies/{company}', [\App\Http\Controllers\Api\CompanyController::class, 'destroy'])->middleware('throttle:api');

// Company Subscriptions
Route::get('companies/{company}/subscriptions', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'index'])->middleware('throttle:api');
Route::post('companies/{company}/subscriptions', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'store'])->middleware('throttle:api');
Route::get('subscriptions/{subscription}', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'show'])->middleware('throttle:api');
Route::post('subscriptions/{subscription}/activate', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'activate'])->middleware('throttle:api');
Route::post('subscriptions/{subscription}/renew', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'renew'])->middleware('throttle:api');
Route::get('subscriptions/{subscription}/delivery-stats', [\App\Http\Controllers\Api\CompanySubscriptionController::class, 'deliveryStats'])->middleware('throttle:api');

// Company Employees
Route::get('companies/{company}/employees', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'index'])->middleware('throttle:api');
Route::post('companies/{company}/employees', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'store'])->middleware('throttle:api');
Route::post('companies/{company}/employees/import-csv', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'importFromCSV'])->middleware('throttle:api');
Route::get('employees/{employee}', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'show'])->middleware('throttle:api');
Route::put('employees/{employee}', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'update'])->middleware('throttle:api');
Route::post('employees/{employee}/activate', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'activate'])->middleware('throttle:api');
Route::post('employees/{employee}/deactivate', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'deactivate'])->middleware('throttle:api');
Route::post('employees/{employee}/reset-password', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'resetPassword'])->middleware('throttle:api');
Route::delete('employees/{employee}', [\App\Http\Controllers\Api\CompanyEmployeeController::class, 'destroy'])->middleware('throttle:api');

// Employee Meal Plans
Route::get('my-meal-plans', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'index'])->middleware('throttle:api');
Route::post('subscriptions/{subscription}/meal-plans', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'store'])->middleware('throttle:api');
Route::get('meal-plans/{mealPlan}', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'show'])->middleware('throttle:api');
Route::put('meal-plans/{mealPlan}', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'update'])->middleware('throttle:api');
Route::post('meal-plans/{mealPlan}/confirm', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'confirm'])->middleware('throttle:api');
Route::get('meal-plans/{mealPlan}/stats', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'stats'])->middleware('throttle:api');
Route::delete('meal-plans/{mealPlan}', [\App\Http\Controllers\Api\EmployeeMealPlanController::class, 'destroy'])->middleware('throttle:api');

// Deliveries
Route::get('companies/{company}/deliveries/pending', [\App\Http\Controllers\Api\DeliveryController::class, 'pending'])->middleware('throttle:api');
Route::get('companies/{company}/deliveries/by-date', [\App\Http\Controllers\Api\DeliveryController::class, 'byDate'])->middleware('throttle:api');
Route::post('deliveries/{delivery}/mark-delivered', [\App\Http\Controllers\Api\DeliveryController::class, 'markDelivered'])->middleware('throttle:api');
Route::post('deliveries/{delivery}/mark-failed', [\App\Http\Controllers\Api\DeliveryController::class, 'markFailed'])->middleware('throttle:api');
Route::get('subscriptions/{subscription}/deliveries', [\App\Http\Controllers\Api\DeliveryController::class, 'subscriptionHistory'])->middleware('throttle:api');
Route::get('subscriptions/{subscription}/deliveries/stats', [\App\Http\Controllers\Api\DeliveryController::class, 'stats'])->middleware('throttle:api');
Route::get('my-deliveries', [\App\Http\Controllers\Api\DeliveryController::class, 'employeeDeliveries'])->middleware('throttle:api');

// Exports
Route::get('subscriptions/{subscription}/export/pdf', [\App\Http\Controllers\Api\ExportController::class, 'deliveryPlanPDF'])->middleware('throttle:api');
Route::get('subscriptions/{subscription}/export/csv', [\App\Http\Controllers\Api\ExportController::class, 'mealChoicesCSV'])->middleware('throttle:api');
Route::get('meal-plans/{mealPlan}/export/pdf', [\App\Http\Controllers\Api\ExportController::class, 'employeeMealSummaryPDF'])->middleware('throttle:api');
Route::get('subscriptions/{subscription}/export/stats', [\App\Http\Controllers\Api\ExportController::class, 'subscriptionStats'])->middleware('throttle:api');

}); // fin auth:api

