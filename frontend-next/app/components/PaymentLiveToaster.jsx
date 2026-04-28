"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEchoChannel } from '@/lib/useEchoChannel'
import { pushToast } from '@/components/Toaster'

/**
 * Écoute les events `payment.updated` du canal personnel et affiche
 * un toast clair (success/error/info) basé sur le retour webhook FlexPay.
 * Conçu pour être monté une fois au niveau Providers.
 */
export default function PaymentLiveToaster() {
  const { user } = useAuth()

  useEchoChannel({
    enabled: !!user?.id,
    channel: user?.id ? `payments.user.${user.id}` : null,
    event: '.payment.updated',
    onEvent: (payload) => {
      const message = payload?.client_message || 'Mise à jour du paiement.'
      const event = payload?.event
      let type = 'info'
      if (event === 'succeeded') type = 'success'
      else if (event === 'failed') type = 'error'

      pushToast({
        type,
        message,
        duration: type === 'error' ? 5500 : 4000,
      })
    },
  })

  return null
}
