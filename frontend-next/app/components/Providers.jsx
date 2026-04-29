'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import EchoBootstrap from '@/components/EchoBootstrap';
import PaymentLiveToaster from '@/components/PaymentLiveToaster';
import BeamsClient from '@/components/BeamsClient';
import PWAInstaller from '@/components/PWAInstaller';
import OfflineIndicator from '@/components/OfflineIndicator';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <EchoBootstrap />
        <PaymentLiveToaster />
        <BeamsClient />
        <PWAInstaller />
        <OfflineIndicator />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
