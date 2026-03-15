"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import GoldButton from '@/components/GoldButton';
import { apiRequest, API_BASE, getApiErrorMessage } from '@/lib/api';

const REPORT_TYPES = [
  { value: 'orders', label: 'Commandes' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'subscriptions', label: 'Abonnements' },
  { value: 'payments', label: 'Paiements' },
  { value: 'event_requests', label: 'Demandes événementielles' },
  { value: 'activity_summary', label: 'Synthèse d\'activité' },
];

const TYPE_LABELS = Object.fromEntries(REPORT_TYPES.map((t) => [t.value, t.label]));

const STATUS_LABELS = {
  queued: 'En file',
  processing: 'En cours',
  completed: 'Terminé',
  failed: 'Échec',
  pending: 'En attente',
};

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState('orders');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const res = await apiRequest('/api/reports?per_page=20', { method: 'GET' });
      setHistory(res.data || res || []);
      setPagination(res);
    } catch (err) {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const params = { format: 'pdf' };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    try {
      await apiRequest('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params }),
      });
      setSuccess('Rapport mis en file d\'attente. Il apparaîtra dans l\'historique ci-dessous.');
      loadHistory();
      setTimeout(() => {
        setModalOpen(false);
        setSuccess('');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteReport(id) {
    if (!confirm('Supprimer ce rapport de l\'historique ?')) return;
    setDeletingId(id);
    setError('');
    try {
      await apiRequest(`/api/reports/${id}`, { method: 'DELETE' });
      loadHistory();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Rapports administratifs</h1>
          <p className="text-white/70 mt-2">
            Générez des exports PDF pour le pilotage : commandes, utilisateurs, abonnements, paiements, demandes événementielles et synthèse d&apos;activité.
          </p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <GoldButton onClick={() => { setModalOpen(true); setError(''); setSuccess(''); }}>
            Exporter un rapport
          </GoldButton>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-[#d4af37]">Historique des rapports générés</h2>
          </div>
          {loadingHistory ? (
            <div className="p-8 text-center text-white/60">Chargement de l&apos;historique...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-white/60">Aucun rapport généré pour l&apos;instant.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/60 text-sm border-b border-white/10">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                    <th className="px-4 py-3 font-semibold">Généré par</th>
                    <th className="px-4 py-3 font-semibold">Télécharger</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-sm">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-sm">{TYPE_LABELS[r.report_type] ?? r.report_type ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            r.status === 'completed'
                              ? 'bg-green-900/40 text-green-300'
                              : r.status === 'failed'
                              ? 'bg-red-900/40 text-red-300'
                              : 'bg-white/10 text-white/80'
                          }`}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {r.generated_by_user?.name ?? `#${r.generated_by}` ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'completed' && r.file_path ? (
                          <a
                            href={`${API_BASE}/api/reports/${r.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d4af37] hover:underline text-sm"
                          >
                            Télécharger
                          </a>
                        ) : (
                          <span className="text-white/40 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(r.id)}
                          disabled={deletingId !== null}
                          className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                        >
                          {deletingId === r.id ? '…' : 'Supprimer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </main>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !loading && setModalOpen(false)}>
          <div className="bg-[#0b1220] border border-white/20 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#d4af37] mb-4">Exporter un rapport administratif</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Type de rapport</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                >
                  {REPORT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Du</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Au</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>
              <p className="text-white/50 text-xs">Période optionnelle. Laisser vide pour toutes les données.</p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !loading && setModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f5e08a] text-[#0b1220] font-semibold hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Génération...' : 'Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
