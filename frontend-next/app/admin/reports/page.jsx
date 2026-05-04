"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import GoldButton from '@/components/GoldButton';
import { apiRequest, fetchApiBlob, getApiErrorMessage } from '@/lib/api';

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

/** Presets de période pour le rapport global (mensuel ou personnalisé). */
function getPeriodPreset(preset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const toYMD = (d) => d.toISOString().slice(0, 10);
  switch (preset) {
    case 'this_month':
      return {
        dateFrom: toYMD(new Date(y, m, 1)),
        dateTo: toYMD(now),
        label: 'Ce mois',
      };
    case 'last_month': {
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      return { dateFrom: toYMD(first), dateTo: toYMD(last), label: 'Mois dernier' };
    }
    case 'this_quarter': {
      const q = Math.floor(m / 3) + 1;
      const first = new Date(y, (q - 1) * 3, 1);
      return { dateFrom: toYMD(first), dateTo: toYMD(now), label: `T${q} ${y}` };
    }
    case 'this_year':
      return {
        dateFrom: `${y}-01-01`,
        dateTo: toYMD(now),
        label: `Année ${y}`,
      };
    default:
      return { dateFrom: '', dateTo: '', label: 'Personnalisé' };
  }
}

const PERIOD_PRESETS = [
  { id: 'this_month', label: 'Ce mois' },
  { id: 'last_month', label: 'Mois dernier' },
  { id: 'this_quarter', label: 'Ce trimestre' },
  { id: 'this_year', label: 'Année en cours' },
  { id: 'custom', label: 'Personnalisé' },
];

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

const defaultPeriod = getPeriodPreset('this_month');

export default function ReportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState('orders');
  const [periodPreset, setPeriodPreset] = useState('this_month');
  const [dateFrom, setDateFrom] = useState(defaultPeriod.dateFrom);
  const [dateTo, setDateTo] = useState(defaultPeriod.dateTo);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  function applyPreset(presetId) {
    setPeriodPreset(presetId);
    if (presetId === 'custom') {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const { dateFrom: from, dateTo: to } = getPeriodPreset(presetId);
    setDateFrom(from);
    setDateTo(to);
  }

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
      const created = await apiRequest('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params }),
      });

      const reportId = created?.id;
      setSuccess('Rapport mis en file d\'attente. Il apparaîtra dans l\'historique ci-dessous.');
      loadHistory();
      setTimeout(() => {
        setModalOpen(false);
        setSuccess('');
      }, 2500);

      // UX : le job est async. On rafraîchit l'historique jusqu'à ce que le rapport passe en completed,
      // sinon le lien "Télécharger" n'apparaît pas (car il est conditionné à status=completed).
      if (reportId) {
        (async () => {
          for (let i = 0; i < 15; i++) {
            try {
              const res = await apiRequest('/api/reports?per_page=100', { method: 'GET' });
              const list = res?.data || res || [];
              const r = list.find((x) => String(x.id) === String(reportId));
              if (r?.status === 'completed') {
                loadHistory();
                return;
              }
              if (r?.status === 'failed') {
                setError('Échec de génération du rapport.');
                return;
              }
            } catch {}
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        })();
      }
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

  async function handleDownloadReport(report) {
    setError('');
    try {
      const response = await fetchApiBlob(`/api/reports/${report.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `green-express-rapport-${report.report_type || report.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <section className="page-section page-section--admin-tight bg-[#0b1220] text-white min-h-screen">
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
            <GoldButton
              onClick={() => {
                setModalOpen(true)
                setError('')
                setSuccess('')
              }}
            >
              Exporter un rapport
            </GoldButton>
          </div>

        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-500/20 bg-[#0f172a]/80">
            <h2 className="text-lg font-semibold text-[#d4af37]">Historique des rapports générés</h2>
            <p className="text-white/50 text-sm mt-0.5">Rapports PDF par période (mensuel, trimestre, personnalisé).</p>
          </div>
          {loadingHistory ? (
            <div className="p-8 text-center text-white/60">Chargement de l&apos;historique...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-white/60">Aucun rapport généré pour l&apos;instant. Utilisez « Exporter un rapport » avec une période.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#0f172a] border-b border-cyan-500/30">
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Date</th>
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Type</th>
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Période</th>
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Statut</th>
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Généré par</th>
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Télécharger</th>
                    <th className="px-4 py-3 text-cyan-200/90 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r, idx) => {
                    const params = r.params || {};
                    const from = params.date_from ? new Date(params.date_from).toLocaleDateString('fr-FR') : '—';
                    const to = params.date_to ? new Date(params.date_to).toLocaleDateString('fr-FR') : '—';
                    const periodStr = params.date_from || params.date_to ? `${from} → ${to}` : 'Tout';
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-white/10 ${idx % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.07]'} hover:bg-cyan-500/10 transition-colors`}
                      >
                        <td className="px-4 py-3 text-white/85">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3 text-white/85">{TYPE_LABELS[r.report_type] ?? r.report_type ?? '—'}</td>
                        <td className="px-4 py-3 text-white/70 text-xs">{periodStr}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${
                              r.status === 'completed'
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                                : r.status === 'failed'
                                ? 'bg-red-500/25 text-red-300 border border-red-400/40'
                                : 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                            }`}
                          >
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/80">{r.generated_by_user?.name ?? `#${r.generated_by}` ?? '—'}</td>
                        <td className="px-4 py-3">
                          {r.status === 'completed' && r.file_path ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadReport(r)}
                              className="text-[#d4af37] hover:text-amber-300 font-medium text-sm"
                            >
                              Télécharger
                            </button>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </main>
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
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Période (rapport global mensuel ou personnalisé)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PERIOD_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        periodPreset === preset.id
                          ? 'bg-[#d4af37] text-[#0b1220]'
                          : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/15'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Du</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPeriodPreset('custom'); }}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Au</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPeriodPreset('custom'); }}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>
                <p className="text-white/50 text-xs mt-1">Choisir une période pour un rapport ciblé (ex. ce mois). Vide = toutes les données.</p>
              </div>
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
