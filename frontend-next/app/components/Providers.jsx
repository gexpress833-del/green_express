'use client';

import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import PWAInstaller from '@/components/PWAInstaller';
import OfflineIndicator from '@/components/OfflineIndicator';

// Lazy-load runtime-heavy components (not needed on landing/login pages)
const EchoBootstrap = lazy(() => import('@/components/EchoBootstrap'));
const PaymentLiveToaster = lazy(() => import('@/components/PaymentLiveToaster'));
const BeamsClient = lazy(() => import('@/components/BeamsClient'));

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <EchoBootstrap />
          <PaymentLiveToaster />
          <BeamsClient />
        </Suspense>
        <PWAInstaller />
        <OfflineIndicator />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
