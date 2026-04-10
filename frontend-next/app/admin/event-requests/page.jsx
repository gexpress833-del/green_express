"use client"
import Sidebar from '@/components/Sidebar'
import EventRequestsBoard from '@/components/staff/EventRequestsBoard'

export default function AdminEventRequestsPage() {
  return <EventRequestsBoard sidebar={<Sidebar />} />
}
