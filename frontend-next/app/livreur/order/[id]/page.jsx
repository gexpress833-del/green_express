"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiRequest } from '@/lib/api'

export default function LivreurOrderDetails(){
  const { id } = useParams()
  const [order,setOrder]=useState(null)

  useEffect(()=>{
    if(!id) return
    apiRequest(`/api/orders/${id}`, { method:'GET' }).then(r=>setOrder(r)).catch(()=>{})
  },[id])

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        {!order && <p>Chargement...</p>}
        {order && (
          <div>
            <h1 className="text-2xl font-bold">Commande #{order.id}</h1>
            <p className="text-white/70">Client: {order.client?.name}</p>
            <p className="mt-4">Plats: {order.items?.map(i=>i.title).join(', ')}</p>
            <p className="mt-2">Code de validation: {order.validation_code}</p>
          </div>
        )}
      </div>
    </section>
  )
}
