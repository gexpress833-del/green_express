'use client'

import Sidebar from '@/components/Sidebar'
import OrdersBoard from '@/components/staff/OrdersBoard'

export default function AdminOrdersPage() {
  return (
    <OrdersBoard
      sidebar={<Sidebar />}
      spaceLabel="Espace administrateur"
      basePath="/admin/orders"
      showLoyaltyPoints
    />
  )
}
