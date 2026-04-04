'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh';

export default function LivreurLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="livreur">
        <SessionPermissionsRefresh />
        {children}
      </RoleGuard>
    </RequireAuth>
  );
}
