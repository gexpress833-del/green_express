'use client'

import { getOrderTimelineSteps } from '@/lib/orderStatus'

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300 ring-2 ring-emerald-500/50"
        aria-hidden
      >
        ✓
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/25 text-cyan-200 ring-2 ring-cyan-400"
        aria-hidden
      >
        ●
      </span>
    )
  }
  if (state === 'cancelled') {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300 ring-2 ring-red-500/40"
        aria-hidden
      >
        ✕
      </span>
    )
  }
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/35 ring-1 ring-white/15"
      aria-hidden
    >
      ○
    </span>
  )
}

/**
 * Frise de suivi de commande (liste ordonnée pour lecteurs d’écran).
 */
export default function OrderStatusTimeline({ status, className = '' }) {
  const steps = getOrderTimelineSteps(status)

  return (
    <ol className={`space-y-3 ${className}`} aria-label="Étapes de la commande">
      {steps.map((step) => (
        <li key={step.key} className="flex gap-3 items-start" aria-current={step.state === 'current' ? 'step' : undefined}>
          <StepIcon state={step.state} />
          <div className="min-w-0 pt-1">
            <span className="sr-only">
              {step.state === 'done'
                ? 'Terminé : '
                : step.state === 'current'
                  ? 'Étape en cours : '
                  : step.state === 'cancelled'
                    ? ''
                    : 'À venir : '}
            </span>
            <span
              className={`text-sm font-medium leading-snug ${
                step.state === 'cancelled'
                  ? 'text-red-300'
                  : step.state === 'current'
                    ? 'text-cyan-200'
                    : step.state === 'done'
                      ? 'text-white/85'
                      : 'text-white/45'
              }`}
            >
              {step.label}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
