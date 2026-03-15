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
      {toasts.map(t => (
        <div key={t.id} className={`mb-3 max-w-sm rounded-lg px-4 py-3 shadow-lg ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  )
}
