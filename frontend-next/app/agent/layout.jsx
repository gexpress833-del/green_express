'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh';

export default function AgentLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="agent">
        <SessionPermissionsRefresh />
        {children}
      </RoleGuard>
    </RequireAuth>
  );
}
