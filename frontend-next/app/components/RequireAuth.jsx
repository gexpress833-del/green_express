'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getGuestEntryHref } from '@/lib/guestEntry';

/**
 * Protège les routes : redirige vers la landing (/) si l'utilisateur n'est pas connecté.
 * Le middleware redirige aussi en amont quand le cookie de session est absent ; RequireAuth gère le cas session expirée ou invalide.
 */
export default function RequireAuth({ children }) {
  const { user, initialised } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialised) return;
    if (!user) {
      router.replace(getGuestEntryHref(pathname || '/'));
    }
  }, [initialised, user, pathname, router]);

  if (!initialised) {
    return (
      <div className="auth-gate-screen">
        <div className="auth-gate-spinner" aria-hidden />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-gate-unauth">
        <p>Vous devez être connecté pour accéder à cette page.</p>
        <p className="auth-gate-unauth-hint">Redirection vers l&apos;accueil…</p>
      </div>
    );
  }

  return children;
}
