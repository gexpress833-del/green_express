'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { UnreadNotificationsProvider } from '@/contexts/UnreadNotificationsContext';
import PWAInstaller from '@/components/PWAInstaller';
import OfflineIndicator from '@/components/OfflineIndicator';
import NextAuthProvider from '@/components/NextAuthProvider';
import AuthenticatedRuntime from '@/components/AuthenticatedRuntime';
import DeliveryLiveToaster from '@/components/DeliveryLiveToaster';

export default function Providers({ children }) {
  return (
    <NextAuthProvider>
    <AuthProvider>
      <UnreadNotificationsProvider>
      <CartProvider>
        <AuthenticatedRuntime />
        <PWAInstaller />
        <OfflineIndicator />
        <DeliveryLiveToaster />
        {children}
      </CartProvider>
      </UnreadNotificationsProvider>
    </AuthProvider>
    </NextAuthProvider>
  );
}
