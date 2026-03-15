"use client";

import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import GoldButton from '@/components/GoldButton';

const ROLES = [
  { value: 'client', label: 'Client' },
  { value: 'cuisinier', label: 'Cuisinier' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'verificateur', label: 'Vérificateur' },
  { value: 'agent', label: 'Agent' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'admin', label: 'Admin' },
];

export default function CreateUserPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'client',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setCreatedUser(null);
    try {
      const res = await apiRequest('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name?.trim() || form.email?.trim(),
          email: form.email?.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      setCreatedUser(res);
      setSuccess(true);
      setForm({ name: '', email: '', role: 'client', password: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  }

  function createAnother() {
    setSuccess(false);
    setCreatedUser(null);
    setError('');
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#d4af37]">Créer un utilisateur</h1>
            <p className="text-white/70 mt-2">
              Créez un compte et attribuez-lui un rôle. Le rôle est validé et actif dès la création.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="text-white/70 hover:text-[#d4af37] text-sm"
          >
            ← Liste des utilisateurs
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {success && createdUser && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
            <p className="font-semibold">Utilisateur créé avec succès.</p>
            <p className="text-sm mt-1">
              <strong>{createdUser.name || createdUser.email}</strong> — Rôle attribué :{' '}
              <span className="text-[#d4af37]">
                {ROLES.find((r) => r.value === createdUser.role)?.label ?? createdUser.role}
              </span>
              . Vous pouvez modifier le rôle depuis la liste des utilisateurs.
            </p>
            <div className="flex gap-3 mt-3">
              <Link href="/admin/users">
                <GoldButton>Voir la liste</GoldButton>
              </Link>
              <button
                type="button"
                onClick={createAnother}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition"
              >
                Créer un autre
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-[#d4af37] mb-4">
            Nouveau compte et attribution du rôle
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Nom</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom complet"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.com"
                type="email"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Rôle (validé à la création)
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-white/50 text-xs mt-1">
                Le rôle est attribué et actif dès la création du compte.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Mot de passe</label>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 caractères"
                type="password"
                minLength={6}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] outline-none"
                required
              />
            </div>
            <GoldButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création en cours...' : 'Créer l\'utilisateur et valider le rôle'}
            </GoldButton>
          </form>
        </div>
      </div>
    </section>
  );
}
