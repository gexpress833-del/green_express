"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiRequest } from '@/lib/api'

export default function ChefMenuDetails(){
  const params = useParams()
  const id = params?.id
  const [menu, setMenu] = useState(null)

  useEffect(()=>{
    if(!id) return
    apiRequest(`/api/menus/${id}`, { method:'GET' }).then(r=>setMenu(r)).catch(()=>{})
  },[id])

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        {!menu && <p>Chargement du menu...</p>}
        {menu && (
          <div>
            <h1 className="text-2xl font-bold text-[#d4af37]">{menu.title}</h1>
            <p className="text-white/70">Statut: {menu.status || '—'}</p>
            <p className="mt-4 text-white/80">{menu.description}</p>
          </div>
        )}
      </div>
    </section>
  )
}
