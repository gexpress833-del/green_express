'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import EntreprisePendingGate from '@/components/EntreprisePendingGate';

export default function EntrepriseLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="entreprise">
        <EntreprisePendingGate>{children}</EntreprisePendingGate>
      </RoleGuard>
    </RequireAuth>
  );
}
