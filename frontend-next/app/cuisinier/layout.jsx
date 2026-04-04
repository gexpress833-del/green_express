'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh';

export default function CuisinierLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="cuisinier">
        <SessionPermissionsRefresh />
        {children}
      </RoleGuard>
    </RequireAuth>
  );
}