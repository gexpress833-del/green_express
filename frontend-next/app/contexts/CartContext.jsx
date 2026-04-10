'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setItems(loadStoredCart());
  }, [isClient]);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((menu, quantity = 1) => {
    if (!menu?.id) return;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
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
          price: menu.price,
          currency: menu.currency || 'USD',
          title: menu.title || menu.name,
          image: menu.image,
        },
      ];
    });
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
  const totalAmount = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) return { items: [], addItem: () => {}, removeItem: () => {}, updateQuantity: () => {}, clearCart: () => {}, itemCount: 0, totalAmount: 0 };
  return ctx;
}
