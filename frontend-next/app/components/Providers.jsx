'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import EchoBootstrap from '@/components/EchoBootstrap';
import PaymentLiveToaster from '@/components/PaymentLiveToaster';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <EchoBootstrap />
        <PaymentLiveToaster />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
