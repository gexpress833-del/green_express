'use client';

import { useRouter } from 'next/navigation';
import ClientSubpageHeader from '@/components/ClientSubpageHeader';
import ReadOnlyGuard from '@/components/ReadOnlyGuard';
import GoldButton from '@/components/GoldButton';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import PaymentMethodsBanner from '@/components/PaymentMethodsBanner';
import { PROVIDER_OPTIONS } from '@/lib/rdcMobileMoneyProviders';
import { analyzeRdcMobileMoneyPhone, buildRdcOperatorHint } from '@/lib/phoneRdc';
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

function normalizePhoneDrc(value) {
  const cleaned = String(value).replace(/[\s\-()]/g, '').replace(/^0+/, '');
  if (cleaned.startsWith('+')) return cleaned;
  return '+243' + cleaned.replace(/^243/, '');
}

function isValidDrcMobileMoney(phone) {
  const digits = String(phone).replace(/\D/g, '');
  return /^243(8|9)\d{8}$/.test(digits);
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, totalsByCurrency } = useCart();
  const [delivery_address, setDelivery_address] = useState('');
  const [client_phone_number, setClient_phone_number] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phoneAnalysis = useMemo(
    () => analyzeRdcMobileMoneyPhone(client_phone_number),
    [client_phone_number],
  );
  const cartOperatorHint = useMemo(
    () =>
      buildRdcOperatorHint({
        country: 'DRC',
        rawPhone: client_phone_number,
        phoneAnalysis,
        provider: '',
        providerOptions: PROVIDER_OPTIONS.DRC || [],
      }),
    [client_phone_number, phoneAnalysis],
  );

  useEffect(() => {
    if (!user?.phone) return;
    const d = String(user.phone).replace(/\D/g, '');
    if (d.startsWith('243')) {
      setClient_phone_number((prev) => (prev.trim() ? prev : `+${d}`));
    }
  }, [user?.phone]);

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
    if (!client_phone_number.trim()) {
      setError('Indiquez le numéro Mobile Money pour le paiement.');
      return;
    }
    const np = normalizePhoneDrc(client_phone_number.trim());
    if (!isValidDrcMobileMoney(np)) {
      setError('Numéro Mobile Money invalide (RDC : ex. 08… ou +243…).');
      return;
    }
    setSubmitting(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          menu_id: i.menu_id,
          quantity: i.quantity,
          price: i.price,
          currency: i.currency,
          original_price: i.original_price,
          original_currency: i.original_currency,
        })),
        delivery_address: delivery_address.trim(),
        client_phone_number: np,
        currency: Object.keys(totalsByCurrency)[0] || 'CDF',
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
      <section className="page-section min-h-screen bg-[#0b1220] text-white">
        <div className="container">
          <ClientSubpageHeader
            title="Mon panier"
            subtitle="Ajoutez plusieurs plats puis validez votre commande en une fois."
            icon="🛒"
          />

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
                          {item.original_currency && item.original_currency !== item.currency && (
                            <p className="text-white/45 text-xs mt-1">
                              Converti depuis {formatCurrency(item.original_price, item.original_currency)}
                            </p>
                          )}
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
                    <h3 className="text-xl font-semibold mb-2 text-white">Total à payer</h3>
                    <div className="flex flex-col gap-1">
                      {Object.entries(totalsByCurrency).map(([cur, amount]) => (
                        <div
                          key={cur}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-white/60 text-sm">{cur === 'USD' ? 'Dollars' : cur === 'CDF' ? 'Francs congolais' : cur}</span>
                          <span className="text-2xl font-bold text-cyan-300">
                            {formatCurrency(amount, cur)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {Object.keys(totalsByCurrency).length > 1 && (
                      <p className="text-amber-200/80 text-xs mt-3">
                        ⚠️ Votre panier contient des plats facturés dans plusieurs devises.
                        Chaque montant sera débité séparément.
                      </p>
                    )}
                  </div>

                  <form onSubmit={handlePlaceOrder} className="card">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      Adresse et validation
                    </h3>
                    <PaymentMethodsBanner compact className="mb-5" />
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
                    <div className="mb-4">
                      <label className="block text-white/80 mb-2 font-semibold">
                        Numéro Mobile Money (paiement) *
                      </label>
                      <input
                        type="tel"
                        value={client_phone_number}
                        onChange={(e) => setClient_phone_number(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-amber-400 focus:outline-none"
                        placeholder="+243812345678 ou 0812345678"
                        autoComplete="tel"
                        required
                      />
                      <p className="text-white/45 text-xs mt-2">Utilisé pour le débit Mobile Money sur l’écran suivant.</p>
                      {cartOperatorHint && (
                        <p
                          className={`text-xs mt-2 ${
                            cartOperatorHint.type === 'ok'
                              ? 'text-cyan-300/90'
                              : cartOperatorHint.type === 'warn'
                                ? 'text-amber-200/90'
                                : cartOperatorHint.type === 'manual'
                                  ? 'text-white/65'
                                  : 'text-white/45'
                          }`}
                        >
                          {cartOperatorHint.text}
                        </p>
                      )}
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
        </div>
      </section>
    </ReadOnlyGuard>
  );
}
