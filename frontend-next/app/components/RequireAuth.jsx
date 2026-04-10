'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Protège les routes : redirige vers /login avec returnUrl si l'utilisateur n'est pas connecté.
 * Utilisé dans les layouts des zones protégées (client, admin, profile, notifications, evenements, etc.).
 * Le middleware redirige aussi en amont quand le cookie de session est absent ; RequireAuth gère le cas session expirée ou invalide.
 */
export default function RequireAuth({ children }) {
  const { user, initialised } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialised) return;
    if (!user) {
      const returnUrl = encodeURIComponent(pathname || '/');
      router.replace(`/login?returnUrl=${returnUrl}`);
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
        <p className="auth-gate-unauth-hint">Redirection vers la connexion…</p>
      </div>
    );
  }

  return children;
}
