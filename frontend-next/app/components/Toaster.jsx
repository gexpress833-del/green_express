"use client"
import { useEffect, useState } from 'react'

let _listeners = []
export function pushToast(toast) {
  const id = Date.now() + Math.random()
  const t = { id, ...toast }
  _listeners.forEach(fn => fn({ type: 'add', toast: t }))
  return id
}

export function removeToast(id) {
  _listeners.forEach(fn => fn({ type: 'remove', id }))
}

export default function Toaster(){
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const sub = (evt) => {
      if (evt.type === 'add') {
        setToasts(t => [...t, evt.toast])
        setTimeout(() => {
          setToasts(t => t.filter(x => x.id !== evt.toast.id))
        }, (evt.toast.duration || 3500))
      } else if (evt.type === 'remove') {
        setToasts(t => t.filter(x => x.id !== evt.id))
      }
    }
    _listeners.push(sub)
    return () => { _listeners = _listeners.filter(s => s !== sub) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
      {toasts.map(t => {
        const variant = t.type === 'error'
          ? 'bg-red-600 text-white'
          : t.type === 'info'
            ? 'bg-cyan-500/90 text-white border border-cyan-200/30 backdrop-blur'
            : 'bg-green-600 text-white'
        const sizing = t.subtle
          ? 'max-w-xs px-3 py-2 text-xs opacity-95'
          : 'max-w-sm px-4 py-3 text-sm'
        return (
          <div key={t.id} className={`mb-3 rounded-lg shadow-lg ${variant} ${sizing}`}>
            <div className={t.subtle ? 'leading-snug' : 'text-sm'}>{t.message}</div>
          </div>
        )
      })}
    </div>
  )
}
