'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';

export default function VerificateurLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="verificateur">{children}</RoleGuard>
    </RequireAuth>
  );
}
