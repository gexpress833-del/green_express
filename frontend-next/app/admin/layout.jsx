"use client"
import RequireAuth from '@/components/RequireAuth'
import AdminGuard from '@/components/AdminGuard'
import AdminShell from './AdminShell'

export default function AdminLayout({ children }) {
  return (
    <RequireAuth>
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </RequireAuth>
  )
}
