"use client"
import RequireAuth from '@/components/RequireAuth'
import AdminGuard from '@/components/AdminGuard'
import AdminShell from './AdminShell'
import SessionPermissionsRefresh from '@/components/SessionPermissionsRefresh'

export default function AdminLayout({ children }) {
  return (
    <RequireAuth>
      <AdminGuard>
        <SessionPermissionsRefresh />
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </RequireAuth>
  )
}
