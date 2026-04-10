/**
 * Test du flux de connexion (CSRF + POST /api/login) depuis l'environnement.
 * Exécution : node scripts/test-login.mjs
 * Prérequis : backend Laravel démarré (php artisan serve sur le port 8000).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const EMAIL = process.env.TEST_LOGIN_EMAIL || 'client@test.com';
const PASSWORD = process.env.TEST_LOGIN_PASSWORD || 'password';

function parseSetCookie(header) {
  const cookies = {};
  if (!header) return cookies;
  const parts = header.split(';').map((s) => s.trim());
  const [nameVal, ...rest] = parts[0].split('=');
  const name = nameVal?.trim();
  const value = rest.join('=').trim();
  if (name) cookies[name] = decodeURIComponent(value || '');
  return cookies;
}

function toCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ');
}

async function main() {
  console.log('=== Test flux de connexion ===');
  console.log('API_BASE:', API_BASE);
  console.log('Email:', EMAIL);
  console.log('');

  let cookies = {};

  // 1. GET sanctum/csrf-cookie
  console.log('1. GET /sanctum/csrf-cookie');
  try {
    const csrfRes = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      redirect: 'manual',
    });
    const setCookie = csrfRes.headers.get('set-cookie');
    if (setCookie) {
      const parsed = parseSetCookie(setCookie);
      cookies = { ...cookies, ...parsed };
    }
    console.log('   Status:', csrfRes.status);
    console.log('   Cookies reçus:', Object.keys(cookies).join(', ') || '(aucun)');
    if (csrfRes.status !== 200 && csrfRes.status !== 204) {
      console.log('   Corps:', await csrfRes.text());
    }
  } catch (err) {
    console.error('   Erreur:', err.message);
    console.error('   Vérifiez que le backend Laravel est démarré (php artisan serve).');
    process.exit(1);
  }

  const xsrfToken = cookies['XSRF-TOKEN'];
  const cookieHeader = toCookieHeader(cookies);

  // 2. POST /api/login
  console.log('\n2. POST /api/login');
  try {
    const loginRes = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
        ...(xsrfToken && { 'X-XSRF-TOKEN': xsrfToken }),
      },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      redirect: 'manual',
    });

    const body = await loginRes.json().catch(() => ({}));
    console.log('   Status:', loginRes.status);
    console.log('   Réponse:', JSON.stringify(body, null, 2));

    if (loginRes.status === 200 && body.user) {
      console.log('\n✓ Connexion réussie. Utilisateur:', body.user.email, '| Rôle:', body.user.role);
    } else if (loginRes.status === 401 || loginRes.status === 422) {
      console.log('\n✗ Échec connexion:', body.message || body.errors || body);
    } else {
      console.log('\n? Statut inattendu:', loginRes.status);
    }
  } catch (err) {
    console.error('   Erreur:', err.message);
    process.exit(1);
  }
}

main();
