"use client"
import RequireAuth from '@/components/RequireAuth'

export default function NotificationsLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>
}

