import { API_BASE } from './apiBase';

/**
 * Client API pour le backend Laravel (Sanctum Bearer Token).
 * Authentification par token Bearer stocké dans localStorage.
 */

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

/**
 * Récupère le token d'authentification depuis localStorage.
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
 * Stocke le token d'authentification dans localStorage.
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
 * Récupère le cookie CSRF (obligatoire avant POST/PUT/DELETE vers l'API).
 * À appeler avant login / register.
 */
export async function getCsrfCookie() {
  // Plus nécessaire avec l'authentification par token Bearer
  return;
}

/**
 * Construit un message lisible à partir d'une réponse d'erreur API (surtout 422 validation Laravel).
 * Laravel renvoie souvent { message: "...", errors: { champ: ["msg"] } }.
 */
/** Remplace les clés Laravel non traduites (ex. sans fichiers lang/) par un texte lisible. */
function humanizeLaravelValidationMessage(msg) {
  if (typeof msg !== 'string') return msg;
  const s = msg.trim();
  if (s === 'validation.unique') {
    return 'Cette valeur est déjà utilisée.';
  }
  if (s.startsWith('validation.')) {
    return 'Erreur de validation. Vérifiez les champs du formulaire.';
  }
  return msg;
}

function formatApiErrorMessage(status, errorData) {
  if (status === 419) {
    return 'Session de sécurité expirée. Réessayez l’action.';
  }
  const generic = errorData?.message ?? errorData?.error ?? `Erreur ${status}`;
  if (status === 422 && errorData?.errors && typeof errorData.errors === 'object') {
    const first = Object.values(errorData.errors).flat().find(Boolean);
    if (first) return humanizeLaravelValidationMessage(first);
  }
  if (status === 422 && errorData?.message && errorData.message !== 'The given data was invalid.') {
    return errorData.message;
  }
  return generic;
}

/**
 * Retourne le message à afficher pour une erreur levée par apiRequest (ex. pour un toast).
 * Utilise err.message (déjà formaté pour 422) ou err.data.
 */
export function getApiErrorMessage(err) {
  if (err?.message) return humanizeLaravelValidationMessage(err.message);
  if (err?.data?.message) return humanizeLaravelValidationMessage(err.data.message);
  if (err?.data?.errors && typeof err.data.errors === 'object') {
    const first = Object.values(err.data.errors).flat().find(Boolean);
    if (first) return humanizeLaravelValidationMessage(first);
  }
  return humanizeLaravelValidationMessage(err?.data?.error) || 'Une erreur est survenue';
}

/**
 * Prépare les en-têtes avec Authorization Bearer token.
 */
async function buildHeadersWithAuth(method, fetchOptions) {
  const headers = { ...defaultHeaders, ...fetchOptions.headers };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (fetchOptions.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  return headers;
}

/**
 * Requête API authentifiée par token Bearer.
 * @param {string} path - Chemin (ex: '/api/login', '/api/user')
 * @param {object} options - fetch options (method, body, headers)
 */
export async function apiRequest(path, options = {}) {
  const { skipSessionExpiredOn401: _skipFlag, ...fetchOptions } = options;
  const fullURL = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const method = fetchOptions.method || 'GET';

  let headers = await buildHeadersWithAuth(method, fetchOptions);

  let res = await fetch(fullURL, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401) {
    const errorData = await res.json().catch(() => null);
    const isLoginOrRegister =
      path && (path.includes('/api/login') || path.includes('/api/register'));
    /** Polling / CRUD notifications : ne pas forcer reload (évite boucle si 401 ici alors que GET /api/user est OK). */
    const isNotificationsNonBroadcast =
      path &&
      path.includes('/api/notifications') &&
      !path.includes('/api/notifications/broadcast');
    const skipSessionExpired =
      Boolean(_skipFlag) || isNotificationsNonBroadcast;
    const hasCachedUser =
      typeof window !== 'undefined' &&
      (() => {
        try {
          return Boolean(window.localStorage.getItem('green_express_session_user'));
        } catch {
          return false;
        }
      })();
    if (!isLoginOrRegister && typeof window !== 'undefined' && !skipSessionExpired && !hasCachedUser) {
      setAuthToken(null); // Clear invalid token
      const returnUrl = encodeURIComponent(window.location.pathname || '/');
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { returnUrl } }));
    }

    if (skipSessionExpired) {
      return null;
    }

    const message = isLoginOrRegister
      ? formatApiErrorMessage(res.status, errorData)
      : 'Session expirée ou invalide';
    const err = new Error(message);
    err.status = 401;
    err.data = errorData;
    throw err;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = formatApiErrorMessage(res.status, errorData);
    const err = new Error(message);
    err.status = res.status;
    err.data = errorData;
    throw err;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

/**
 * Fetch vers l'API qui retourne un blob (ex. PDF). Utilise les mêmes credentials et cookies que apiRequest.
 * Utiliser pour les téléchargements (orders/{id}/pdf, admin/stats/export-pdf, etc.).
 */
export async function fetchApiBlob(path, options = {}) {
  const fullURL = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const method = options.method || 'GET';
  const headers = { ...options.headers };
  if (!headers.Accept) headers.Accept = 'application/pdf';
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res = await fetch(fullURL, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      setAuthToken(null);
      const returnUrl = encodeURIComponent(window.location.pathname || '/');
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { returnUrl } }));
    }
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Session expirée ou invalide');
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.message || errData?.error || `Erreur ${res.status}`);
  }
  return res;
}

/**
 * Upload image (multipart/form-data) : backend envoie le fichier vers Cloudinary.
 * @param {File} file - fichier image
 * @param {string} [folder] - alias configuré côté API : menus, promotions, uploads, profiles, subscription-plans (ou chemin green-express/…)
 */
export async function uploadImageFile(file, folder = 'uploads') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const headers = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}/api/upload-image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      setAuthToken(null);
      const returnUrl = encodeURIComponent(window.location.pathname || '/');
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { returnUrl } }));
    }
    throw new Error('Session expirée ou invalide');
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.message || errData?.error || `Upload échoué (${res.status})`);
  }
  return res.json();
}

export { API_BASE } from './apiBase';
