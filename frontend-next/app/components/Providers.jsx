'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import EchoBootstrap from '@/components/EchoBootstrap';
import PaymentLiveToaster from '@/components/PaymentLiveToaster';
import BeamsClient from '@/components/BeamsClient';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <EchoBootstrap />
        <PaymentLiveToaster />
        <BeamsClient />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
