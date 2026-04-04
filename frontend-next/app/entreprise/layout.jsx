'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import EntreprisePendingGate from '@/components/EntreprisePendingGate';
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh';

export default function EntrepriseLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="entreprise">
        <SessionPermissionsRefresh />
        <EntreprisePendingGate>{children}</EntreprisePendingGate>
      </RoleGuard>
    </RequireAuth>
  );
}
