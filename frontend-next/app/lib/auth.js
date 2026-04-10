/**
 * Auth API (Sanctum SPA : session via cookies, pas de token).
 */
import { apiRequest, getCsrfCookie } from './api';

/**
 * Connexion : csrf puis POST /api/login.
 * @param {string} loginIdentifier — e-mail ou numéro de téléphone (RDC : ex. 08… ou +243…)
 */
export async function login(loginIdentifier, password) {
  await getCsrfCookie();
  const data = await apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginIdentifier, password }),
  });
  return data;
}

/**
 * Inscription client : csrf puis POST /api/register. Retourne { user }.
 * @param {string} phone — mobile RDC obligatoire (connexion par numéro)
 */
export async function register(email, password, name, phone) {
  await getCsrfCookie();
  const data = await apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      name,
      phone: String(phone || '').trim(),
    }),
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
