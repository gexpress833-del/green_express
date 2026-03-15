'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getMe } from '@/lib/auth';
import * as authLib from '@/lib/auth';

const AuthContext = createContext(null);

/** Délai en ms pendant lequel on ignore "session expirée" après un login réussi (évite logout par une requête qui 401 juste après). */
const GRACE_AFTER_LOGIN_MS = 4000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialised, setInitialised] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const lastLoginAtRef = useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined' || !isClient) return null;
    try {
      const data = await getMe();
      setUser(data);
      setInitialised(true);
      setLoading(false);
      return data;
    } catch {
      setUser(null);
      setInitialised(true);
      setLoading(false);
      return null;
    }
  }, [isClient]);

  // Vérifier la session au montage de l'app
  useEffect(() => {
    if (!isClient) return;
    refreshUser();
  }, [isClient, refreshUser]);

  // Option : rafraîchir quand on revient sur l'onglet
  useEffect(() => {
    if (!isClient) return;
    const onFocus = () => refreshUser();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isClient, refreshUser]);

  // Quand une requête API renvoie 401 (session expirée), déconnecter et rediriger vers login
  // (sauf dans les GRACE_AFTER_LOGIN_MS ms suivant un login réussi, pour éviter logout juste après connexion)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSessionExpired = async (event) => {
      if (Date.now() - lastLoginAtRef.current < GRACE_AFTER_LOGIN_MS) return;
      const returnUrl = event?.detail?.returnUrl || encodeURIComponent(window.location.pathname || '/');
      setUser(null);
      setInitialised(true);
      setLoading(false);
      try {
        await authLib.logout();
      } catch {}
      window.location.href = `/login?returnUrl=${returnUrl}`;
    };
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authLib.login(email, password);
    if (data?.user) {
      lastLoginAtRef.current = Date.now();
      setUser(data.user);
      setInitialised(true);
      setLoading(false);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authLib.logout();
    } catch {}
    setUser(null);
    setInitialised(true);
    setLoading(false);
  }, []);

  const value = {
    user,
    loading,
    initialised,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
