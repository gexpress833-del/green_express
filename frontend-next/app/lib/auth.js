/**
 * Auth API (Sanctum Bearer Token).
 */
import { apiRequest } from './api';

/**
 * Stocke le token dans localStorage
 */
function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem('green_express_auth_token', token);
    } else {
      localStorage.removeItem('green_express_auth_token');
    }
  } catch {
    /* ignore */
  }
}

/**
 * Récupère le token depuis localStorage
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('green_express_auth_token');
  } catch {
    return null;
  }
}

/**
 * Connexion : POST /api/login.
 * @param {string} loginIdentifier — e-mail ou numéro de téléphone (RDC : ex. 08… ou +243…)
 */
export async function login(loginIdentifier, password) {
  const data = await apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: loginIdentifier, password }),
  });
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Inscription client : POST /api/register. Retourne { user }.
 * @param {string} phone — mobile RDC obligatoire (connexion par numéro)
 */
export async function register(email, password, name, phone) {
  const data = await apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      name,
      phone: String(phone || '').trim(),
    }),
  });
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data;
}

/** Déconnexion : invalide la session côté serveur. */
export async function logout() {
  try {
    await apiRequest('/api/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout request failed:', err.message);
  } finally {
    setAuthToken(null);
  }
}

/** Utilisateur connecté (GET /api/user). Utilisé par useAuth pour vérifier la session. */
export async function getMe() {
  const result = await apiRequest('/api/user', { method: 'GET' });
  return result;
}
