<?php

namespace App\Livewire\Admin;

use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\DeliveryLog;
use App\Models\Menu;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\FlexPayService;
use App\Services\OrderNotificationService;
use App\Services\Orders\FlexPayPendingPaymentSyncService;
use App\Services\Orders\OrderFlexPayInitiationService;
use App\Services\Orders\OrderManualPaymentConfirmationService;
use App\Support\OrderStatusPresenter;
use App\Support\PaymentStatusPresenter;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithFileUploads;
use Livewire\WithPagination;

#[Layout('layouts.app')]
#[Title('Administration')]
class ResourcePage extends Component
{
    use WithPagination;
    use WithFileUploads;

    public string $section = 'menus';
    public string $search = '';
    public ?int $editingId = null;
    public array $form = [];
    public $photo = null;

    /** Modal admin : initier FlexPay pour une commande */
    public ?int $flexPayOrderId = null;

    public string $flexPayPhoneInput = '';

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function mount(string $section): void
    {
        abort_unless(auth()->user()?->role === 'admin', 403);
        abort_unless(array_key_exists($section, $this->sections()), 404);
        $this->section = $section;
        $this->resetForm();
        $this->flexPayOrderId = null;
        $this->flexPayPhoneInput = '';
    }

    public function sections(): array
    {
        return [
            'menus' => 'Menus',
            'users' => 'Utilisateurs',
            'orders' => 'Commandes',
            'companies' => 'Entreprises',
            'subscriptions' => 'Abonnements',
            'company-subscriptions' => 'Abonnements B2B',
            'payments' => 'Paiements',
            'deliveries' => 'Livraisons',
            'reports' => 'Rapports',
            'settings' => 'Paramètres',
        ];
    }

    public function resetForm(): void
    {
        $this->editingId = null;
        $this->photo = null;
        $this->form = match ($this->section) {
            'menus' => ['title' => '', 'description' => '', 'price' => '', 'currency' => 'USD', 'status' => 'draft', 'created_by' => null, 'is_available' => true, 'image' => ''],
            'users' => ['name' => '', 'email' => '', 'phone' => '', 'role' => 'client', 'password' => ''],
            default => [],
        };
    }

    public function edit(int $id): void
    {
        $this->editingId = $id;

        if ($this->section === 'menus') {
            $menu = Menu::findOrFail($id);
            $this->form = [
                'title' => (string) $menu->title,
                'description' => (string) $menu->description,
                'price' => (string) $menu->price,
                'currency' => (string) ($menu->currency ?: 'USD'),
                'status' => (string) ($menu->status ?: 'draft'),
                'created_by' => $menu->created_by,
                'is_available' => (bool) $menu->is_available,
                'image' => (string) ($menu->image ?? ''),
            ];
        }

        if ($this->section === 'users') {
            $user = User::findOrFail($id);
            $this->form = [
                'name' => (string) $user->name,
                'email' => (string) $user->email,
                'phone' => (string) ($user->phone ?? ''),
                'role' => (string) ($user->role ?: 'client'),
                'password' => '',
            ];
        }

        session()->flash('admin_status', 'Élément chargé en modification.');
        $this->dispatch('admin-resource-editing');
    }

    public function save(): void
    {
        if ($this->section === 'menus') {
            $data = $this->validate([
                'form.title' => ['required', 'string', 'max:255'],
                'form.description' => ['nullable', 'string', 'max:1000'],
                'form.price' => ['required', 'numeric', 'min:0'],
                'form.currency' => ['required', Rule::in(['USD', 'CDF'])],
                'form.status' => ['required', Rule::in(['draft', 'pending', 'approved', 'rejected'])],
                'form.created_by' => ['nullable', 'exists:users,id'],
                'form.is_available' => ['boolean'],
                'photo' => ['nullable', 'image', 'max:2048'],
            ])['form'];

            if ($this->photo) {
                try {
                    if ($this->editingId) {
                        $oldImage = Menu::whereKey($this->editingId)->value('image');
                        if ($oldImage && str_contains($oldImage, 'res.cloudinary.com')) {
                            CloudinaryService::deleteImage($oldImage);
                        }
                    }

                    $uploaded = CloudinaryService::uploadImage($this->photo, 'menus');
                    $data['image'] = $uploaded['url'];
                } catch (\Exception $e) {
                    logger()->error('Cloudinary upload error', ['error' => $e->getMessage()]);
                    session()->flash('admin_error', 'Erreur upload photo (horloge système désynchronisée). Les autres données ont été sauvegardées.');
                }
            } elseif ($this->editingId) {
                $existingImage = Menu::whereKey($this->editingId)->value('image');
                if ($existingImage) {
                    $data['image'] = $existingImage;
                }
            }

            Menu::updateOrCreate(['id' => $this->editingId], $data);
        }

        if ($this->section === 'users') {
            $rules = [
                'form.name' => ['required', 'string', 'max:255'],
                'form.email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->editingId)],
                'form.phone' => ['nullable', 'string', 'max:30'],
                'form.role' => ['required', Rule::in(['admin', 'client', 'cuisinier', 'livreur', 'entreprise', 'verificateur', 'secretaire', 'agent'])],
                'form.password' => [$this->editingId ? 'nullable' : 'required', 'string', 'min:8'],
            ];
            $data = $this->validate($rules)['form'];
            if ($data['password'] !== '') {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }
            User::updateOrCreate(['id' => $this->editingId], $data);
        }

        session()->flash('admin_status', 'Enregistrement effectué.');
        $this->resetForm();
    }

    public function delete(int $id): void
    {
        if ($this->section === 'menus') {
            $image = Menu::whereKey($id)->value('image');
            if ($image && str_contains($image, 'res.cloudinary.com')) {
                CloudinaryService::deleteImage($image);
            }

            Menu::whereKey($id)->delete();
        }

        if ($this->section === 'users' && auth()->id() !== $id) {
            User::whereKey($id)->delete();
        }

        session()->flash('admin_status', 'Suppression effectuée.');
    }

    public function updateOrderStatus(int $id, string $status, OrderNotificationService $orderNotifications): void
    {
        if (! in_array($status, OrderStatusPresenter::values(), true)) {
            session()->flash('admin_error', 'Statut de commande invalide.');

            return;
        }

        $order = Order::findOrFail($id);
        $old = (string) $order->status;
        if ($old === $status) {
            return;
        }

        $order->update(['status' => $status]);
        $orderNotifications->notifyStatusChanged($order->load('user'), $old, $status, auth()->user());
        session()->flash('admin_status', 'Statut de commande mis à jour.');
    }

    public function assignDriver(int $id, ?string $driverId): void
    {
        Order::whereKey($id)->update(['livreur_id' => $driverId ?: null]);
        session()->flash('admin_status', 'Livreur assigné.');
    }

    public function updatePaymentStatus(int $id, string $status): void
    {
        if (! in_array($status, PaymentStatusPresenter::values(), true)) {
            session()->flash('admin_error', 'Statut de paiement invalide.');

            return;
        }

        Payment::whereKey($id)->update(['status' => $status]);
        session()->flash('admin_status', 'Paiement mis à jour.');
    }

    public function openFlexPayOrderModal(int $orderId): void
    {
        $this->flexPayOrderId = $orderId;
        $this->flexPayPhoneInput = '';
    }

    public function closeFlexPayOrderModal(): void
    {
        $this->flexPayOrderId = null;
        $this->flexPayPhoneInput = '';
    }

    public function submitAdminFlexPayInitiation(OrderFlexPayInitiationService $init): void
    {
        $this->validate([
            'flexPayPhoneInput' => ['required', 'string', 'min:9', 'max:30'],
        ]);

        if (! $this->flexPayOrderId) {
            session()->flash('admin_error', 'Commande non sélectionnée.');

            return;
        }

        $order = Order::findOrFail($this->flexPayOrderId);
        $result = $init->initiate($order, auth()->user(), [
            'client_phone_number' => $this->flexPayPhoneInput,
            'country_code' => 'DRC',
        ]);

        if (! $result['ok']) {
            session()->flash('admin_error', $result['message']);

            return;
        }

        session()->flash('admin_status', $result['data']['message'] ?? 'Paiement initié.');
        $this->closeFlexPayOrderModal();
    }

    public function refreshOrderFlexPay(int $orderId, FlexPayPendingPaymentSyncService $sync): void
    {
        $order = Order::findOrFail($orderId);
        $changed = $sync->trySyncOrderPayment($order);
        session()->flash('admin_status', $changed ? 'Synchronisation FlexPay : statut mis à jour.' : 'Aucun changement (déjà à jour, pas de paiement FlexPay en attente, ou intervalle de vérification non atteint).');
    }

    public function confirmOrderManual(int $orderId, OrderManualPaymentConfirmationService $confirm): void
    {
        $order = Order::findOrFail($orderId);
        try {
            $confirm->confirm($order, auth()->user(), 'manual', null, null, ['source' => 'admin_livewire']);
            session()->flash('admin_status', 'Commande marquée comme payée. Code livraison généré.');
        } catch (\InvalidArgumentException $e) {
            session()->flash('admin_error', $e->getMessage());
        }
    }

    public function updateSubscriptionStatus(int $id, string $status): void
    {
        Subscription::whereKey($id)->update(['status' => $status]);
        session()->flash('admin_status', 'Abonnement mis à jour.');
    }

    public function render()
    {
        return view('livewire.admin.resource-page', [
            'title' => $this->sections()[$this->section],
            'rows' => $this->rows(),
            'chefs' => User::where('role', 'cuisinier')->orderBy('name')->get(),
            'drivers' => User::where('role', 'livreur')->orderBy('name')->get(),
            'flexpayConfigured' => app(FlexPayService::class)->isConfigured(),
        ]);
    }

    private function rows()
    {
        $search = trim($this->search);

        return match ($this->section) {
            'menus' => Menu::with('creator')->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))->latest()->paginate(12),
            'users' => User::when($search, fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))->latest()->paginate(12),
            'orders' => Order::with(['user', 'deliveryDriver', 'payment'])->when($search, fn ($q) => $q->where('uuid', 'like', "%{$search}%"))->latest()->paginate(12),
            'companies' => Company::with('contactUser')->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))->latest()->paginate(12),
            'subscriptions' => Subscription::with('user')->latest()->paginate(12),
            'company-subscriptions' => CompanySubscription::with('company')->latest()->paginate(12),
            'payments' => Payment::with(['order', 'subscription', 'companySubscription'])->latest()->paginate(12),
            'deliveries' => DeliveryLog::with('company')->latest()->paginate(12),
            default => collect(),
        };
    }
}
