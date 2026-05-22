'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const EchoBootstrap = lazy(() => import('@/components/EchoBootstrap'));
const PaymentLiveToaster = lazy(() => import('@/components/PaymentLiveToaster'));
const NotificationLiveToaster = lazy(() => import('@/components/NotificationLiveToaster'));
const AppBadgeSync = lazy(() => import('@/components/AppBadgeSync'));
const BeamsClient = lazy(() => import('@/components/BeamsClient'));
const FcmBootstrap = lazy(() => import('@/components/FcmBootstrap'));

function isLowEndAndroid() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  return /Android/i.test(ua) && (memory <= 3 || cores <= 4);
}

export default function AuthenticatedRuntime() {
  const { isAuthenticated } = useAuth();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setEnabled(false);
      return;
    }
    const delay = isLowEndAndroid() ? 6000 : 1200;
    const timer = window.setTimeout(() => setEnabled(true), delay);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  if (!isAuthenticated || !enabled) return null;

  return (
    <Suspense fallback={null}>
      <EchoBootstrap />
      <PaymentLiveToaster />
      <NotificationLiveToaster />
      <AppBadgeSync />
      {!isLowEndAndroid() && <BeamsClient />}
      {!isLowEndAndroid() && <FcmBootstrap />}
    </Suspense>
  );
}
