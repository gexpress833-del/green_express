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
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
        <div className="w-10 h-10 border-2 border-[#d4af37]/50 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0b1220] text-white/80">
        <p>Vous devez être connecté pour accéder à cette page.</p>
        <p className="text-sm text-white/50">Redirection vers la connexion…</p>
      </div>
    );
  }

  return children;
}
