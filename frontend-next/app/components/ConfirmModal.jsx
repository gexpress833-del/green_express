'use client'

import { useEffect } from 'react'

const VARIANTS = {
  danger: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    iconColor:  '#f87171',
    iconBg:     'rgba(239,68,68,0.12)',
    iconBorder: '1px solid rgba(239,68,68,0.3)',
    titleColor: '#fca5a5',
    confirmBg:  '#ef4444',
    ring:       'rgba(239,68,68,0.25)',
  },
  warning: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    iconColor:  '#fb923c',
    iconBg:     'rgba(249,115,22,0.12)',
    iconBorder: '1px solid rgba(249,115,22,0.3)',
    titleColor: '#fdba74',
    confirmBg:  '#f97316',
    ring:       'rgba(249,115,22,0.25)',
  },
  info: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    iconColor:  '#22d3ee',
    iconBg:     'rgba(6,182,212,0.12)',
    iconBorder: '1px solid rgba(6,182,212,0.3)',
    titleColor: '#67e8f9',
    confirmBg:  '#06b6d4',
    ring:       'rgba(6,182,212,0.25)',
  },
}

export default function ConfirmModal({
  title,
  message,
  variant = 'warning',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}) {
  const v = VARIANTS[variant] || VARIANTS.warning

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={onCancel}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 0 1px ' + v.ring + ', 0 30px 80px rgba(0,0,0,0.7)',
        padding: '24px',
        boxSizing: 'border-box',
        animation: 'modalIn 0.18s ease-out',
      }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <span style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 46, height: 46,
            borderRadius: 12,
            background: v.iconBg,
            border: v.iconBorder,
            color: v.iconColor,
          }}>
            {v.icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2
              id="confirm-modal-title"
              style={{ fontSize: 16, fontWeight: 700, color: v.titleColor, margin: 0, lineHeight: 1.3 }}
            >
              {title}
            </h2>
            {message && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 0 }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.75)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: 12,
              border: 'none',
              background: v.confirmBg,
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
