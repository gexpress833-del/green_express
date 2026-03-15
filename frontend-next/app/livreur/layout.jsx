'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';

export default function LivreurLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="livreur">{children}</RoleGuard>
    </RequireAuth>
  );
}
