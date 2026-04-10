"use client"
import MenusListView from '@/components/MenusListView'

export default function CuisinierMenusPage(){
  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-1200 mx-auto px-4">
        <MenusListView variant="cuisinier" />
      </div>
    </section>
  )
}
