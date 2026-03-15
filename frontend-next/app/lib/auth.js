/**
 * Auth API (Sanctum SPA : session via cookies, pas de token).
 */
import { apiRequest, getCsrfCookie } from './api';

/** Connexion : appelle d'abord csrf-cookie, puis POST /api/login. Retourne { user }. */
export async function login(email, password) {
  await getCsrfCookie();
  const data = await apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

/** Inscription : csrf puis POST /api/register. Retourne { user }. */
export async function register(email, password, name) {
  await getCsrfCookie();
  const data = await apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  return data;
}

/** Déconnexion : invalide la session côté serveur. */
export async function logout() {
  try {
    await apiRequest('/api/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout request failed:', err.message);
  }
}

/** Utilisateur connecté (GET /api/user). Utilisé par useAuth pour vérifier la session. */
export async function getMe() {
  const result = await apiRequest('/api/user', { method: 'GET' });
  return result;
}

export async function registerCompany(contactName, contactEmail, contactPassword, companyData) {
  await getCsrfCookie();
  const data = await apiRequest('/api/register-company', {
    method: 'POST',
    body: JSON.stringify({
      contact_name: contactName,
      contact_email: contactEmail,
      contact_password: contactPassword,
      company_name: companyData.companyName,
      institution_type: companyData.institutionType,
      company_phone: companyData.companyPhone,
      company_address: companyData.companyAddress,
      employee_count: companyData.employeeCount,
      employees: companyData.employees || [],
    }),
  });
  return data;
}
