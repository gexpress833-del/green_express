"use client"
import RequireAuth from '@/components/RequireAuth'
import AdminGuard from '@/components/AdminGuard'

export default function AdminLayout({ children }) {
  return (
    <RequireAuth>
      <AdminGuard>{children}</AdminGuard>
    </RequireAuth>
  )
}
