/**
 * Client API pour le backend Laravel (Sanctum SPA).
 * Session portée par cookies httpOnly : toutes les requêtes en credentials: 'include'.
 * Pas de token en localStorage.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

/**
 * Extrait le token XSRF du cookie XSRF-TOKEN.
 */
function getXsrfToken() {
  if (typeof document === 'undefined') return null;
  const name = 'XSRF-TOKEN';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Récupère le cookie CSRF (obligatoire avant POST/PUT/DELETE vers l'API).
 * À appeler avant login / register.
 */
export async function getCsrfCookie() {
  let res;
  try {
    res = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });
  } catch (err) {
    const base = typeof window !== 'undefined' ? API_BASE : process.env.NEXT_PUBLIC_API_URL || '(build-time)';
    throw new Error(
      `Impossible de contacter le serveur. URL utilisée : ${base}. Vérifiez NEXT_PUBLIC_API_URL sur Vercel (ex. https://green-express-rdc.onrender.com) puis redéployez.`
    );
  }
  if (!res.ok) {
    throw new Error(
      'Cookie de sécurité indisponible. Vérifiez la configuration CORS de l\'API (origines autorisées, credentials: true) et que la route /sanctum/csrf-cookie existe.'
    );
  }
}

/**
 * Construit un message lisible à partir d'une réponse d'erreur API (surtout 422 validation Laravel).
 * Laravel renvoie souvent { message: "...", errors: { champ: ["msg"] } }.
 */
function formatApiErrorMessage(status, errorData) {
  const generic = errorData?.message ?? errorData?.error ?? `Erreur ${status}`;
  if (status === 422 && errorData?.errors && typeof errorData.errors === 'object') {
    const first = Object.values(errorData.errors).flat().find(Boolean);
    if (first) return first;
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
  if (err?.message) return err.message;
  if (err?.data?.message) return err.data.message;
  if (err?.data?.errors && typeof err.data.errors === 'object') {
    const first = Object.values(err.data.errors).flat().find(Boolean);
    if (first) return first;
  }
  return err?.data?.error || 'Une erreur est survenue';
}

/**
 * Requête API authentifiée par session (cookies).
 * @param {string} path - Chemin (ex: '/api/login', '/api/user')
 * @param {object} options - fetch options (method, body, headers)
 */
export async function apiRequest(path, options = {}) {
  const fullURL = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const method = options.method || 'GET';
  const headers = { ...defaultHeaders, ...options.headers };
  
  // Ajouter le token XSRF pour les requêtes non-GET
  if (method !== 'GET') {
    const xsrfToken = getXsrfToken();
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken;
    }
  }

  // Pas de Content-Type pour FormData (upload)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(fullURL, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401) {
    const errorData = await res.json().catch(() => null);
    const isLoginOrRegister =
      (path && (path.includes('/api/login') || path.includes('/api/register')));
    if (!isLoginOrRegister && typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(window.location.pathname || '/');
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { returnUrl } }));
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
  if (method !== 'GET') {
    const xsrfToken = getXsrfToken();
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
  }
  const res = await fetch(fullURL, { ...options, credentials: 'include', headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
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
 * Upload image (multipart/form-data) vers Cloudinary via l'API.
 * @param {File} file - fichier image
 * @param {string} [folder] - dossier Cloudinary (ex: 'promotions', 'green-express/promotions', 'menus')
 */
export async function uploadImageFile(file, folder = 'uploads') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const xsrfToken = typeof document !== 'undefined' ? getXsrfToken() : null;
  const headers = { Accept: 'application/json' };
  if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;

  const res = await fetch(`${API_BASE}/api/upload-image`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
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

export { API_BASE };
