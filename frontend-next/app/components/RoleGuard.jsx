'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Restreint les routes à un rôle donné (ex: livreur, verificateur, entreprise).
 * À utiliser après RequireAuth dans les layouts.
 */
export default function RoleGuard({ role, children }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const basePath = `/${role}`;
  /** Si l’API n’envoie pas encore `role`, on n’affiche pas un écran vide (undefined !== 'client'). */
  const actualRole = user?.role ?? null;

  useEffect(() => {
    if (!user) return;
    if (!pathname?.startsWith(basePath)) return;
    if (actualRole == null) return;
    if (actualRole !== role) {
      router.replace(`/${actualRole}`);
    }
  }, [user, pathname, router, role, basePath, actualRole]);

  if (user && actualRole != null && actualRole !== role && pathname?.startsWith(basePath)) {
    return (
      <div className="auth-gate-screen">
        <div className="auth-gate-spinner" aria-hidden />
        <p className="text-white/70 text-sm mt-4 text-center px-4 max-w-md">
          Redirection vers votre espace…
        </p>
      </div>
    );
  }

  return children;
}
