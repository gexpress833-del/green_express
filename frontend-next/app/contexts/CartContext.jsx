'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { convertMenuPrice, getStoredCurrencyPreference, getStoredUsdCdfRate, setStoredCurrencyPreference, syncUsdCdfRate } from '@/lib/currencyPreference';

const CART_STORAGE_KEY = 'green_express_cart';

const CartContext = createContext(null);

function loadStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [preferredCurrency, setPreferredCurrencyState] = useState('CDF');
  const [usdCdfRate, setUsdCdfRate] = useState(2800);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setItems(loadStoredCart());
    setPreferredCurrencyState(getStoredCurrencyPreference());
    setUsdCdfRate(getStoredUsdCdfRate());
    syncUsdCdfRate(apiRequest).then(setUsdCdfRate).catch(() => {});
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const onCurrencyChange = (event) => {
      setPreferredCurrencyState(event?.detail?.currency || getStoredCurrencyPreference());
    };
    window.addEventListener('green-express:currency-change', onCurrencyChange);
    return () => window.removeEventListener('green-express:currency-change', onCurrencyChange);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const onRateChange = (event) => {
      setUsdCdfRate(event?.detail?.rate || getStoredUsdCdfRate());
    };
    window.addEventListener('green-express:currency-rate-change', onRateChange);
    return () => window.removeEventListener('green-express:currency-rate-change', onRateChange);
  }, [isClient]);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((menu, quantity = 1) => {
    if (!menu?.id) return;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const priced = convertMenuPrice(menu, preferredCurrency, usdCdfRate);
    setItems((prev) => {
      const existing = prev.find((i) => i.menu_id === menu.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_id === menu.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          menu_id: menu.id,
          quantity: qty,
          price: priced.price,
          currency: priced.currency,
          original_price: priced.originalPrice,
          original_currency: priced.originalCurrency,
          exchange_rate: priced.rate,
          title: menu.title || menu.name,
          image: menu.image,
        },
      ];
    });
  }, [preferredCurrency, usdCdfRate]);

  const setPreferredCurrency = useCallback((currency) => {
    const next = setStoredCurrencyPreference(currency);
    setPreferredCurrencyState(next);
    setItems([]);
    return next;
  }, []);

  const removeItem = useCallback((menuId) => {
    setItems((prev) => prev.filter((i) => i.menu_id !== menuId));
  }, []);

  const updateQuantity = useCallback((menuId, quantity) => {
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    if (qty === 0) {
      setItems((prev) => prev.filter((i) => i.menu_id !== menuId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menu_id === menuId ? { ...i, quantity: qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  // Totaux groupés par devise (USD/CDF/...) — éviter d'additionner des devises différentes.
  const totalsByCurrency = items.reduce((acc, i) => {
    const cur = i.currency || 'USD';
    const line = (Number(i.price) || 0) * i.quantity;
    acc[cur] = (acc[cur] || 0) + line;
    return acc;
  }, {});
  // Compatibilité ascendante : si une seule devise présente, on expose totalAmount.
  const currencies = Object.keys(totalsByCurrency);
  const totalAmount = currencies.length === 1 ? totalsByCurrency[currencies[0]] : 0;
  const totalCurrency = currencies.length === 1 ? currencies[0] : null;

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    totalAmount,
    totalCurrency,
    totalsByCurrency,
    preferredCurrency,
    setPreferredCurrency,
    usdCdfRate,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) return { items: [], addItem: () => {}, removeItem: () => {}, updateQuantity: () => {}, clearCart: () => {}, itemCount: 0, totalAmount: 0, totalCurrency: null, totalsByCurrency: {}, preferredCurrency: 'CDF', setPreferredCurrency: () => 'CDF', usdCdfRate: 2800 };
  return ctx;
}
