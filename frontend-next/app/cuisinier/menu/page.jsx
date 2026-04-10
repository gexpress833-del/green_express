"use client"
import MenusListView from '@/components/MenusListView'

export default function MenuPage() {
  return (
    <section className="page-section bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenusListView variant="cuisinier" />
      </div>
    </section>
  )
}
