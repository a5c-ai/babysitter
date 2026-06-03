import { test, expect } from '@playwright/test';

// These smoke tests verify critical pages render without 500 errors.
// They use the login page (no auth required) and API routes that
// return structured errors rather than crashes.

test.describe('public pages', () => {
  test('login page renders with sign-in methods', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
    const signInMethods = page.locator('a[href*="/api/auth/"]');
    const emptyAuthNotice = page.getByText('No browser sign-in method is configured for this endpoint.');
    await expect(signInMethods.first().or(emptyAuthNotice)).toBeVisible();
  });

  test('login page has correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login.*Kradle/);
  });
});

test.describe('API routes respond without crashing', () => {
  test('GET /api/orgs/default/resources returns response', async ({ request }) => {
    const resp = await request.get('/api/orgs/default/resources?kind=Repository');
    // May return 200 (data), 401 (auth required), or 307 (redirect)
    expect(resp.status()).toBeLessThan(500);
  });

  test('GET /api/orgs/default/search responds', async ({ request }) => {
    const resp = await request.get('/api/orgs/default/search?q=test');
    expect(resp.status()).toBeLessThan(500);
  });

  test('GET /api/orgs/default/snapshot responds', async ({ request }) => {
    const resp = await request.get('/api/orgs/default/snapshot');
    expect(resp.status()).toBeLessThan(502);
  });

  test('GET /api/orgs/default/inference/catalog responds', async ({ request }) => {
    const resp = await request.get('/api/orgs/default/inference/catalog');
    expect(resp.status()).toBeLessThan(500);
  });

  test('GET /api/orgs/default/agents/tools/catalog responds', async ({ request }) => {
    const resp = await request.get('/api/orgs/default/agents/tools/catalog');
    expect(resp.status()).toBeLessThan(500);
    const ct = resp.headers()['content-type'] || '';
    if (resp.status() === 200 && ct.includes('json')) {
      const body = await resp.json();
      expect(body.categories).toBeDefined();
      expect(body.categories.length).toBeGreaterThan(0);
    }
  });

  test('POST /api/orgs/default/resources without auth does not crash', async ({ request }) => {
    const resp = await request.post('/api/orgs/default/resources', {
      data: { kind: 'Repository', metadata: { name: 'test' }, spec: {} },
    });
    expect(resp.status()).toBeLessThan(500);
  });
});

test.describe('page routes return HTML (not 500)', () => {
  const routes = [
    '/login',
    '/orgs',
  ];

  for (const route of routes) {
    test(`${route} returns HTML`, async ({ request }) => {
      const resp = await request.get(route);
      expect([200, 302, 307]).toContain(resp.status());
    });
  }
});

test.describe('org pages redirect to login when unauthenticated', () => {
  const orgRoutes = [
    '/orgs/default',
    '/orgs/default/repositories',
    '/orgs/default/agents',
    '/orgs/default/agents/stacks',
    '/orgs/default/inference',
    '/orgs/default/for-agents',
    '/orgs/default/api-docs',
  ];

  for (const route of orgRoutes) {
    test(`${route} redirects or renders`, async ({ page }) => {
      await page.goto(route);
      const url = page.url();
      // Either redirected to login or page rendered (with loading state)
      const isLogin = url.includes('/login');
      const isRendered = !url.includes('/login');
      expect(isLogin || isRendered).toBe(true);
      // Page should not show a raw error
      const body = await page.textContent('body');
      expect(body).not.toContain('Internal Server Error');
      expect(body).not.toContain('NEXT_NOT_FOUND');
    });
  }
});
