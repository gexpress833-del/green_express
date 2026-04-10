'use client'

import SecretaireSidebar from '@/components/SecretaireSidebar'
import OrdersBoard from '@/components/staff/OrdersBoard'

export default function SecretaireOrdersPage() {
  return (
    <OrdersBoard
      sidebar={<SecretaireSidebar />}
      spaceLabel="Secretariat - commandes"
      basePath="/secretaire/orders"
      showLoyaltyPoints
    />
  )
}
