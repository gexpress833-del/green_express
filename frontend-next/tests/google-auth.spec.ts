import { test, expect } from '@playwright/test';

/**
 * Tests E2E du flux Google Sign-In.
 *
 * On ne peut pas (et on ne doit pas) automatiser le consentement Google en CI :
 * - on vérifie la présence du bouton sur /login,
 * - on intercepte le clic pour confirmer que NextAuth déclenche bien la redirection OAuth Google,
 * - on vérifie côté backend que /api/auth/google rejette une requête sans id_token.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

test.describe('Google Sign-In', () => {
  test.setTimeout(45000);

  test('bouton « Continuer avec Google » visible sur /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const btn = page.getByRole('button', { name: /Continuer avec Google/i });
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toBeEnabled();
  });

  test('clic sur le bouton démarre le flux OAuth Google via NextAuth', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const btn = page.getByRole('button', { name: /Continuer avec Google/i });

    // On bloque la redirection vers accounts.google.com pour ne pas dépendre du
    // service externe : il suffit de vérifier que NextAuth tente bien d'y aller.
    const googleRedirectPromise = page.waitForRequest(
      (req) =>
        req.url().startsWith('https://accounts.google.com/') ||
        req.url().includes('/api/auth/signin/google') ||
        req.url().includes('/api/auth/callback/google'),
      { timeout: 15000 },
    );

    await btn.click();

    const req = await googleRedirectPromise;
    expect(req.url()).toMatch(/accounts\.google\.com|\/api\/auth\/(signin|callback)\/google/);
  });

  test('POST /api/auth/google rejette une requête sans id_token (422)', async ({ request }) => {
    // CSRF cookie d'abord (Sanctum SPA)
    const csrf = await request.get(`${API_URL}/sanctum/csrf-cookie`);
    expect(csrf.ok(), 'Sanctum CSRF cookie inaccessible. Backend démarré ?').toBeTruthy();

    const res = await request.post(`${API_URL}/api/auth/google`, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      data: {},
    });

    // Laravel validation renvoie 422 quand id_token est manquant.
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.errors?.id_token ?? body.message).toBeTruthy();
  });

  test('POST /api/auth/google rejette un id_token invalide', async ({ request }) => {
    await request.get(`${API_URL}/sanctum/csrf-cookie`);
    const res = await request.post(`${API_URL}/api/auth/google`, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      data: { id_token: 'invalid-token-xxx' },
    });
    // 422 (jeton invalide) attendu, 500 = bug à corriger.
    expect([401, 422]).toContain(res.status());
  });
});
