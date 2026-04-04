'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh';

export default function VerificateurLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="verificateur">
        <SessionPermissionsRefresh />
        {children}
      </RoleGuard>
    </RequireAuth>
  );
}
