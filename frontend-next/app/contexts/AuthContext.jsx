'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getMe } from '@/lib/auth';
import * as authLib from '@/lib/auth';
import { normalizeSessionUser } from '@/lib/sessionUser';

const AuthContext = createContext(null);

/** Délai en ms pendant lequel on ignore "session expirée" après un login réussi (évite logout par une requête qui 401 juste après). */
const GRACE_AFTER_LOGIN_MS = 4000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialised, setInitialised] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const lastLoginAtRef = useRef(0);
  /** La session (connecté ou invité) a été déterminée au moins une fois — ne plus réinitialiser l’UI sur erreur réseau. */
  const sessionResolvedRef = useRef(false);
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined' || !isClient) return null;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const run = (async () => {
      try {
        const data = await getMe();
        const nextUser =
          data === undefined || data === null ? null : normalizeSessionUser(data);
        setUser(nextUser);
        setInitialised(true);
        setLoading(false);
        sessionResolvedRef.current = true;
        return nextUser;
      } catch (err) {
        const status = err?.status;
        if (status === 401) {
          setUser(null);
          setInitialised(true);
          setLoading(false);
          sessionResolvedRef.current = true;
          return null;
        }
        if (sessionResolvedRef.current) {
          setLoading(false);
          return null;
        }
        setUser(null);
        setInitialised(true);
        setLoading(false);
        sessionResolvedRef.current = true;
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = run;
    return run;
  }, [isClient]);

  /** Une seule vérification au chargement : pas de rafraîchissement au focus (évite oscillations navbar / état). */
  useEffect(() => {
    if (!isClient) return;
    refreshUser();
  }, [isClient, refreshUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSessionExpired = async () => {
      if (Date.now() - lastLoginAtRef.current < GRACE_AFTER_LOGIN_MS) return;
      setUser(null);
      setInitialised(true);
      setLoading(false);
      sessionResolvedRef.current = true;
      try {
        await authLib.logout();
      } catch {}
      window.location.assign('/');
    };
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, []);

  const login = useCallback(async (loginIdentifier, password) => {
    const data = await authLib.login(loginIdentifier, password);
    if (data?.user) {
      const normalized = normalizeSessionUser(data.user);
      lastLoginAtRef.current = Date.now();
      setUser(normalized);
      setInitialised(true);
      setLoading(false);
      sessionResolvedRef.current = true;
      if (!normalized) {
        try {
          await authLib.logout();
        } catch {}
        const err = new Error(
          'Compte incomplet (rôle manquant). Contactez un administrateur ou reconnectez-vous.'
        );
        err.code = 'SESSION_INCOMPLETE';
        throw err;
      }
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
    sessionResolvedRef.current = true;
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  }, []);

  const value = {
    user,
    loading,
    initialised,
    /** Réservé aux sessions avec id + rôle valides (voir normalizeSessionUser). */
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
