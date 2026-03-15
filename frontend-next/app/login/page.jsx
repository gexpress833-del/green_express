'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { login: authLogin } = useAuth();

  // Réinitialiser l'état au montage pour que le bouton ne reste pas désactivé après une redirection
  useEffect(() => {
    setLoading(false);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authLogin(email, password);
      if (!response?.user) {
        setError('Connexion réussie mais informations utilisateur manquantes.');
        setLoading(false);
        return;
      }
      const role = response.user.role || 'client';
      const dashboardByRole = `/${role}`;
      const returnUrl = searchParams.get('returnUrl') || '';
      const allowedCommonPrefixes = ['/profile', '/notifications', '/evenements'];
      const isOwnDashboard = returnUrl === dashboardByRole || returnUrl.startsWith(dashboardByRole + '/');
      const isAllowedCommon = allowedCommonPrefixes.some((p) => returnUrl === p || returnUrl.startsWith(p + '/'));
      const isReturnUrlAllowed =
        returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//') &&
        (isOwnDashboard || isAllowedCommon);
      const target = isReturnUrlAllowed ? returnUrl : dashboardByRole;
      window.location.href = target;
    } catch (err) {
      const msg = err?.data?.errors?.email?.[0] ?? err?.data?.message ?? err?.message ?? 'Erreur de connexion. Vérifiez vos identifiants.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-[#0b1220] to-blue-900 border border-[#d4af37]/30 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Green Express</h1>
          <p className="text-[#d4af37] text-center mb-8">Bienvenue</p>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#f5e08a] text-[#0b1220] font-bold py-3 rounded-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/70 text-sm">
              Pas encore inscrit?{' '}
              <Link href="/register" className="text-[#d4af37] hover:text-[#f5e08a] font-semibold">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
