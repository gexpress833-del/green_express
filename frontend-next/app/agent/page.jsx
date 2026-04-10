'use client';

import Link from 'next/link';
import DashboardGreeting from '@/components/DashboardGreeting';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Espace agent (employé rattaché à une entreprise).
 * Les commandes / budget détaillés passent par l’entreprise ; l’agent a un point d’entrée dédié.
 */
export default function AgentDashboard() {
  const { user } = useAuth();

  return (
    <section className="page-section min-h-screen">
      <div className="container max-w-3xl mx-auto">
        <DashboardGreeting>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #39ff14 0%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Espace agent
          </h1>
          <p className="text-white/75">
            Bonjour{user?.name ? `, ${user.name}` : ''}. Vous êtes connecté en tant qu’agent d’entreprise.
          </p>
        </DashboardGreeting>

        <div className="card p-6 sm:p-8 space-y-4 border border-white/10">
          <p className="text-white/80 m-0 leading-relaxed">
            Les commandes d’équipe et le budget sont gérés depuis l’espace entreprise. Utilisez les liens ci-dessous
            pour votre compte personnel (profil, notifications).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/profile"
              className="inline-flex justify-center items-center min-h-[44px] px-5 py-3 rounded-xl font-semibold border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10 transition"
            >
              Mon profil
            </Link>
            <Link
              href="/notifications"
              className="inline-flex justify-center items-center min-h-[44px] px-5 py-3 rounded-xl font-semibold border border-white/20 text-white/90 hover:bg-white/5 transition"
            >
              Notifications
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
