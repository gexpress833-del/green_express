'use client'

import { useState } from 'react'

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Z"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 4L21 22M10.6 10.6a3 3 0 004.8 4.8M9.9 5.1A10.4 10.4 0 0112 5c5 0 9.27 3.11 11 7.5a11.6 11.6 0 01-4.02 5.02M6.2 6.2C3.96 7.87 2.17 10.2 1 12.5 2.73 16.89 7 20 12 20c1.64 0 3.21-.32 4.65-.9"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Champ mot de passe avec icône œil pour basculer visible/masqué.
 * Utilisable directement comme `<PasswordInput value={...} onChange={...} className={...} ... />`.
 */
export default function PasswordInput({ className, ...rest }) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        className={className}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        style={{ ...(rest.style || {}), paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={show}
        title={show ? 'Masquer' : 'Afficher'}
        style={{
          position: 'absolute',
          top: '50%',
          right: 8,
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 0,
          padding: 6,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.65)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
