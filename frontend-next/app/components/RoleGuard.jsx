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

  useEffect(() => {
    if (!user) return;
    if (!pathname?.startsWith(basePath)) return;
    if (user.role !== role) {
      // Rôle explicite : rediriger vers le tableau de bord du rôle (évite admin/entreprise bloqués sur /client)
      const dashboard = user.role ? `/${user.role}` : '/profile';
      router.replace(dashboard);
    }
  }, [user, pathname, router, role, basePath]);

  if (user && user.role !== role && pathname?.startsWith(basePath)) {
    return null;
  }

  return children;
}
