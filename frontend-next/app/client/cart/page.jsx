'use client';

import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import ReadOnlyGuard from '@/components/ReadOnlyGuard';
import GoldButton from '@/components/GoldButton';
import { useCart } from '@/contexts/CartContext';
import { apiRequest } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function formatCurrency(amount, currency) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (Number.isNaN(num)) return '—';
  const curr = currency || 'USD';
  if (['USD', 'CDF'].includes(curr)) {
    const locale = curr === 'USD' ? 'en-US' : 'fr-CD';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(num);
  }
  return `${num.toFixed(2)} ${curr}`;
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const [delivery_address, setDelivery_address] = useState('');
  const [client_phone_number, setClient_phone_number] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError('Votre panier est vide.');
      return;
    }
    if (!delivery_address.trim()) {
      setError('Veuillez indiquer l\'adresse de livraison.');
      return;
    }
    setSubmitting(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          menu_id: i.menu_id,
          quantity: i.quantity,
          price: i.price,
        })),
        delivery_address: delivery_address.trim(),
      };
      const order = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      clearCart();
      router.push(`/client/orders/create?order_id=${order.id}`);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la création de la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'order']} showWarning={false}>
      <section className="page-section min-h-screen text-white">
        <div className="container">
          <div className="dashboard-grid">
            <ClientSidebar />
            <main className="main-panel">
              <h1 className="text-4xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                🛒 Mon panier
              </h1>
              <p className="text-white/70 mb-8">
                Ajoutez plusieurs plats puis validez votre commande en une fois.
              </p>

              {items.length === 0 ? (
                <div className="card text-center py-16">
                  <p className="text-white/70 text-lg mb-4">Votre panier est vide.</p>
                  <GoldButton href="/client/menus">Voir les menus</GoldButton>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {items.map((item) => (
                      <div
                        key={item.menu_id}
                        className="card flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                      >
                        {item.image && (
                          <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <p className="text-amber-400 font-bold mt-1">
                            {formatCurrency(item.price, item.currency)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_id, item.quantity - 1)}
                            className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-bold"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                            className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-bold"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.menu_id)}
                            className="ml-2 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card mb-6">
                    <h3 className="text-xl font-semibold mb-4" style={{
                      background: 'linear-gradient(135deg, #9d4edd 0%, #00ffff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      Total : {formatCurrency(totalAmount, items[0]?.currency || 'USD')}
                    </h3>
                  </div>

                  <form onSubmit={handlePlaceOrder} className="card">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      Adresse et validation
                    </h3>
                    {error && (
                      <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                        {error}
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="block text-white/80 mb-2 font-semibold">
                        Adresse de livraison *
                      </label>
                      <textarea
                        value={delivery_address}
                        onChange={(e) => setDelivery_address(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-amber-400 focus:outline-none"
                        rows={3}
                        placeholder="Adresse complète de livraison..."
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-lg transition disabled:opacity-50"
                      >
                        {submitting ? 'Création...' : 'Passer la commande'}
                      </button>
                      <Link
                        href="/client/menus"
                        className="inline-block px-6 py-3 border border-white/30 rounded-lg text-white/90 hover:bg-white/10 transition"
                      >
                        Continuer mes achats
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </ReadOnlyGuard>
  );
}
