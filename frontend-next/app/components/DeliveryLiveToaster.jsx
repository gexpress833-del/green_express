'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEchoChannel } from '@/lib/useEchoChannel'
import { pushToast } from '@/components/Toaster'

/**
 * Écoute les events `order.updated` du canal personnel et affiche
 * un toast de confirmation quand la livraison est validée par le livreur.
 */
export default function DeliveryLiveToaster() {
  const { user } = useAuth()

  useEchoChannel({
    enabled: !!user?.id,
    channel: user?.id ? `orders.user.${user.id}` : null,
    event: '.order.updated',
    onEvent: (payload) => {
      const action = payload?.action
      const status = payload?.status

      if (action === 'status_changed' && status === 'delivered') {
        pushToast({
          type: 'success',
          message: 'Votre commande a été livrée ! Points de fidélité crédités.',
          duration: 6000,
        })
      }
    },
  })

  return null
}
