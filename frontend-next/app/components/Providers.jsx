'use client';

import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { UnreadNotificationsProvider } from '@/contexts/UnreadNotificationsContext';
import PWAInstaller from '@/components/PWAInstaller';
import OfflineIndicator from '@/components/OfflineIndicator';
import NextAuthProvider from '@/components/NextAuthProvider';

// Lazy-load runtime-heavy components (not needed on landing/login pages)
const EchoBootstrap = lazy(() => import('@/components/EchoBootstrap'));
const PaymentLiveToaster = lazy(() => import('@/components/PaymentLiveToaster'));
const NotificationLiveToaster = lazy(() => import('@/components/NotificationLiveToaster'));
const AppBadgeSync = lazy(() => import('@/components/AppBadgeSync'));
const BeamsClient = lazy(() => import('@/components/BeamsClient'));
const FcmBootstrap = lazy(() => import('@/components/FcmBootstrap'));

export default function Providers({ children }) {
  return (
    <NextAuthProvider>
    <AuthProvider>
      <UnreadNotificationsProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <EchoBootstrap />
          <PaymentLiveToaster />
          <NotificationLiveToaster />
          <AppBadgeSync />
          <BeamsClient />
          <FcmBootstrap />
        </Suspense>
        <PWAInstaller />
        <OfflineIndicator />
        {children}
      </CartProvider>
      </UnreadNotificationsProvider>
    </AuthProvider>
    </NextAuthProvider>
  );
}
