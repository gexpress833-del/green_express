'use client'

import SecretaireSidebar from '@/components/SecretaireSidebar'
import EventRequestsBoard from '@/components/staff/EventRequestsBoard'

export default function SecretaireEventRequestsPage() {
  return (
    <EventRequestsBoard
      sidebar={<SecretaireSidebar />}
      titleStyle={{
        background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 45%, #fde68a 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    />
  )
}
