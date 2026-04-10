import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

/** Connexion via API avec partage des cookies */
async function loginAsVerificateur(page, request) {
  // Login via API
  const res = await request.post(`${API_URL}/api/login`, {
    data: { email: 'test@test.com', password: 'password' },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
  });
  if (!res.ok()) {
    throw new Error(`Backend login failed: ${res.status()}. Démarrez le backend (php artisan serve).`);
  }
  const body = await res.json();
  const user = body.user;
  if (!user) throw new Error('API login did not return user.');
  
  // For Sanctum session auth, navigate to a page which will automatically include the session cookie
  // The request made above stored the session cookie internally
  await page.goto(`${BASE_URL}/verificateur`);
  await page.waitForURL(/\/verificateur/, { timeout: 10000 });
}

test.describe('Vérificateur - Validation ticket', () => {
  test.setTimeout(60000);

  test('backend is reachable', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/promotions`);
    expect(res.ok(), `Backend inaccessible. Lancez: cd backend && php artisan serve`).toBeTruthy();
  });

  test('verificateur can open validate page and see form', async ({ page, request }) => {
    await loginAsVerificateur(page, request);
    await expect(page).toHaveURL(/\/verificateur/);

    await page.goto(`${BASE_URL}/verificateur/validate`);
    await expect(page.getByPlaceholder(/Entrez le code du ticket/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Valider le ticket/i })).toBeVisible();
  });

  test('verificateur can submit ticket code and get response', async ({ page, request }) => {
    await loginAsVerificateur(page, request);
    await expect(page).toHaveURL(/\/verificateur/);

    await page.goto(`${BASE_URL}/verificateur/validate`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('validate');
  });
});
