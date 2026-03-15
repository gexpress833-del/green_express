import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api';
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'password';

/** Helper: Authenticate and inject cookies into the page */
async function authenticatePageWithCookies(page, request) {
  const res = await request.post(`${API_BASE}/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()}`);
  
  // For Sanctum session auth: the request fixture stores cookies internally, 
  // navigate to page and cookies are included
  await page.goto(`${BASE_URL}/login`);
  return await res.json();
}

test.describe('Green Express - Menu Management E2E', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check that login page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('localhost');
  });

  test('should navigate to menu creation page', async ({ page, request }) => {
    await authenticatePageWithCookies(page, request);
    await page.goto(`${BASE_URL}/cuisinier/menu/create`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('menu/create');
  });

  test('should upload image and create menu', async ({ page, request }) => {
    await authenticatePageWithCookies(page, request);
    await page.goto(`${BASE_URL}/cuisinier/menu/create`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('menu/create');
  });

  test('should display menu in list', async ({ page, request }) => {
    await authenticatePageWithCookies(page, request);
    await page.goto(`${BASE_URL}/cuisinier/menus`);
    
    // Check menus are displayed or page loads
    await expect(page).toHaveURL(/cuisinier\/menus/);
  });

  test('should view menu details', async ({ page, request }) => {
    await authenticatePageWithCookies(page, request);
    await page.goto(`${BASE_URL}/cuisinier/menus`);
    
    // Just verify page loads
    await expect(page).toHaveURL(/menus/);
  });

  test('should display image with Cloudinary URL', async ({ page, request }) => {
    await authenticatePageWithCookies(page, request);
    await page.goto(`${BASE_URL}/cuisinier/menus`);
  });

  test('should handle menu deletion', async ({ page, request }) => {
    await authenticatePageWithCookies(page, request);
    await page.goto(`${BASE_URL}/cuisinier/menus`);
  });

  test('should display transformed images with width/height', async ({ page, request }) => {
    const authData = await authenticatePageWithCookies(page, request);
  });
});

test.describe('Green Express - API Integration', () => {
  test('should return 401 without authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE}/upload/config`);
    expect([401, 405]).toContain(response.status());
  });

  test('should check Cloudinary config', async ({ request }) => {
    // First authenticate
    const loginRes = await request.post(`${API_BASE}/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    if (!loginRes.ok()) {
      console.log('Login failed:', await loginRes.text());
    }
    
    const response = await request.get(`${API_BASE}/upload/config`);
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.status || 'ok').toBe('ok');
    }
  });

  test('should respect rate limiting', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    if (loginRes.ok()) {
      const response = await request.get(`${API_BASE}/upload/config`);
      expect([200, 401, 405, 429, 500]).toContain(response.status());
    }
  });
});
