'use client'

import RequireAuth from '@/components/RequireAuth'
import RoleGuard from '@/components/RoleGuard'
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh'

export default function SecretaireLayout({ children }) {
  return (
    <RequireAuth>
      <RoleGuard role="secretaire">
        <SessionPermissionsRefresh />
        <a href="#contenu-secretaire" className="skip-link">Aller au contenu principal</a>
        <div id="contenu-secretaire" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </RoleGuard>
    </RequireAuth>
  )
}
