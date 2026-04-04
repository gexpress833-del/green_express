'use client';

import RequireAuth from '@/components/RequireAuth';
import RoleGuard from '@/components/RoleGuard';
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh';

export default function ClientLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="client">
        <SessionPermissionsRefresh />
        <a href="#contenu-client" className="skip-link">
          Aller au contenu principal
        </a>
        <div id="contenu-client" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </RoleGuard>
    </RequireAuth>
  );
}
