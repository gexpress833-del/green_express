// Color Constants
export const COLORS = {
  BLUE_DARK: '#0b1220',
  GOLD: '#d4af37',
  WHITE: '#ffffff',
  GOLD_LIGHT: '#f5e08a',
  GOLD_DARK: '#b8961f',
  WHITE_TRANSPARENT: 'rgba(255, 255, 255, 0.05)',
};

// Role Constants (alignés sur backend: cuisinier, verificateur, entreprise)
export const ROLES = {
  ADMIN: 'admin',
  CUISINIER: 'cuisinier',
  LIVREUR: 'livreur',
  VERIFICATEUR: 'verificateur',
  CLIENT: 'client',
  ENTREPRISE: 'entreprise',
};

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    LOGOUT: '/api/logout',
    ME: '/api/me',
  },
  UPLOADS: {
    PRESIGN: '/uploads/presign',
    CONFIRM: '/uploads/confirm',
  },
  MENUS: {
    LIST: '/api/menus',
    CREATE: '/api/menus',
    UPDATE: (id) => `/api/menus/${id}`,
    DELETE: (id) => `/api/menus/${id}`,
    VALIDATE: (id) => `/api/menus/${id}/validate`,
  },
  PROMOTIONS: {
    LIST: '/api/promotions',
    CREATE: '/api/promotions',
    UPDATE: (id) => `/api/promotions/${id}`,
    DELETE: (id) => `/api/promotions/${id}`,
  },
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    UPDATE: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
  },
  PAYMENTS: {
    LIST: '/api/payments',
  },
  SUBSCRIPTIONS: {
    LIST: '/api/subscriptions',
  },
  STATS: {
    ADMIN: '/api/admin/stats',
    CUISINIER: '/api/cuisinier/stats',
    CLIENT: '/api/client/stats',
    LIVREUR: '/api/livreur/stats',
    VERIFICATEUR: '/api/verificateur/stats',
    ENTREPRISE: '/api/entreprise/stats',
  },
};

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Connecté avec succès',
    REGISTER: 'Inscrit avec succès',
    UPLOAD: 'Image uploadée avec succès',
    CREATE: 'Créé avec succès',
    UPDATE: 'Mis à jour avec succès',
    DELETE: 'Supprimé avec succès',
  },
  ERROR: {
    UNAUTHORIZED: 'Veuillez vous connecter',
    FORBIDDEN: 'Accès refusé',
    NOT_FOUND: 'Non trouvé',
    SERVER_ERROR: 'Erreur serveur',
    UPLOAD_FAILED: 'Échec du chargement',
    INVALID_FORM: 'Formulaire invalide',
  },
};

// Vercel.Blob Configuration
export const BLOB_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BLOB_BASE || 'https://vercel.blob.greenexpress.app',
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
};
