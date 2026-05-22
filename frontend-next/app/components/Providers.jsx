'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { UnreadNotificationsProvider } from '@/contexts/UnreadNotificationsContext';
import PWAInstaller from '@/components/PWAInstaller';
import OfflineIndicator from '@/components/OfflineIndicator';
import NextAuthProvider from '@/components/NextAuthProvider';
import AuthenticatedRuntime from '@/components/AuthenticatedRuntime';

export default function Providers({ children }) {
  return (
    <NextAuthProvider>
    <AuthProvider>
      <UnreadNotificationsProvider>
      <CartProvider>
        <AuthenticatedRuntime />
        <PWAInstaller />
        <OfflineIndicator />
        {children}
      </CartProvider>
      </UnreadNotificationsProvider>
    </AuthProvider>
    </NextAuthProvider>
  );
}
