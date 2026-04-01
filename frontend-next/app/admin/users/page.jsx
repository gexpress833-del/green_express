"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import GoldButton from '@/components/GoldButton';
import { apiRequest } from '@/lib/api';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'cuisinier', label: 'Cuisinier' },
  { value: 'client', label: 'Client' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'verificateur', label: 'Vérificateur' },
  { value: 'agent', label: 'Agent' },
  { value: 'entreprise', label: 'Entreprise' },
];

const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get('role') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(roleFromUrl);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pagination, setPagination] = useState(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    if (roleFromUrl) setRoleFilter(roleFromUrl);
  }, [roleFromUrl]);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ per_page: 20, page: String(page) });
      if (roleFilter) params.set('role', roleFilter);
      const q = searchRef.current.trim();
      if (q) params.set('search', q);
      const res = await apiRequest(`/api/users?${params}`, { method: 'GET' });
      setUsers(res.data || res || []);
      setPagination(res);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  async function handleSearch(e) {
    e?.preventDefault?.();
    loadUsers(1);
  }

  async function updateRole(userId, newRole) {
    setUpdatingRoleId(userId);
    try {
      await apiRequest(`/api/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de rôle');
    } finally {
      setUpdatingRoleId(null);
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Supprimer l'utilisateur « ${u.name || u.email } » ? Cette action est irréversible.`)) {
      return;
    }
    setDeletingId(u.id);
    setError('');
    try {
      await apiRequest(`/api/users/${u.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((user) => user.id !== u.id));
      if (pagination?.total != null) setPagination((p) => ({ ...p, total: (p?.total ?? 1) - 1 }));
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }

  const currentPage = pagination?.current_page ?? 1;
  const lastPage = pagination?.last_page ?? 1;

  return (
    <section className="page-section page-section--admin-tight bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Utilisateurs</h1>
          <p className="text-white/70 mt-2">
            Consultez, éditez et gérez les comptes et rôles des utilisateurs.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/admin/users/create">
            <GoldButton>Créer un utilisateur</GoldButton>
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email)..."
              className="flex-1 min-w-0 p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] outline-none text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition text-sm"
            >
              Rechercher
            </button>
          </form>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none text-sm"
          >
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white/60">
              Chargement des utilisateurs...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-white/60 text-sm border-b border-white/10">
                      <th className="px-4 py-3 font-semibold">Nom</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Rôle</th>
                      <th className="px-4 py-3 font-semibold">Inscrit le</th>
                      <th className="px-4 py-3 font-semibold">Modifier le rôle</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {u.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/90">
                          {u.email || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 text-white/90">
                            {ROLE_LABELS[u.role] ?? u.role ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role ?? ''}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                            disabled={updatingRoleId === u.id}
                            className="p-2 rounded bg-white/10 border border-white/20 text-white text-sm focus:border-[#d4af37] outline-none disabled:opacity-50"
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          {updatingRoleId === u.id && (
                            <span className="ml-2 text-white/50 text-xs">
                              ...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            disabled={deletingId === u.id}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-900/50 border border-red-700/50 text-red-200 hover:bg-red-900/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === u.id ? 'Suppression...' : 'Supprimer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lastPage > 1 && (
                <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-sm text-white/60">
                  <span>
                    Page {currentPage} / {lastPage}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadUsers(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => loadUsers(currentPage + 1)}
                      disabled={currentPage >= lastPage}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
