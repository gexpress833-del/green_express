'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';

export default function ClientLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="client">{children}</RoleGuard>
    </RequireAuth>
  );
}
