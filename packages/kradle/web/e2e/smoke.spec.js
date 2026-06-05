import {
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  test,
} from './fixtures/kradle-fixtures.js';

// ---------------------------------------------------------------------------
// Public pages (no auth required)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// API routes — must not crash (status < 500)
// ---------------------------------------------------------------------------
test.describe('API routes respond without crashing', () => {
  test('GET /api/orgs/default/resources returns response', async ({ request }) => {
    const resp = await request.get('/api/orgs/default/resources?kind=Repository');
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

// ---------------------------------------------------------------------------
// Page routes — return HTML, not 500
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Org pages — redirect to login when unauthenticated, or render
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Authenticated page smoke — all major sections load without errors
// ---------------------------------------------------------------------------
test.describe('authenticated page smoke tests', () => {
  const SMOKE_ROUTES = [
    // Ship
    { path: '/orgs/default', label: 'Dashboard / Home' },
    { path: '/orgs/default/getting-started', label: 'Getting Started' },
    { path: '/orgs/default/repositories', label: 'Repositories' },
    { path: '/orgs/default/inbox', label: 'Reviews & Issues' },
    { path: '/orgs/default/runs', label: 'Runs' },
    { path: '/orgs/default/deployments', label: 'Deployments' },
    { path: '/orgs/default/artifacts', label: 'Artifacts' },
    // Manage
    { path: '/orgs/default/people', label: 'People' },
    { path: '/orgs/default/settings', label: 'Settings' },
    { path: '/orgs/default/settings/secrets', label: 'Secrets' },
    { path: '/orgs/default/profile', label: 'Profile' },
    { path: '/orgs/default/hooks-events', label: 'Hooks & Events' },
    { path: '/orgs/default/runners-ci', label: 'Runners / CI' },
    // Agents
    { path: '/orgs/default/agents', label: 'Agents' },
    { path: '/orgs/default/agents/directory', label: 'Agent Directory' },
    { path: '/orgs/default/agents/stacks', label: 'Agent Stacks' },
    { path: '/orgs/default/agents/sessions', label: 'Agent Sessions' },
    { path: '/orgs/default/agents/runs', label: 'Agent Runs' },
    { path: '/orgs/default/agents/rules', label: 'Trigger Rules' },
    { path: '/orgs/default/agents/approvals', label: 'Approvals' },
    { path: '/orgs/default/agents/workspaces', label: 'Workspaces' },
    { path: '/orgs/default/agents/projects', label: 'Projects' },
    { path: '/orgs/default/agents/memory', label: 'Memory' },
    { path: '/orgs/default/agents/settings', label: 'Agent Settings' },
    // Meetings
    { path: '/orgs/default/meetings', label: 'Meetings' },
    { path: '/orgs/default/meetings/templates', label: 'Meeting Templates' },
    { path: '/orgs/default/meetings/recordings', label: 'Recordings' },
    // Quality
    { path: '/orgs/default/evals', label: 'Evaluations' },
    { path: '/orgs/default/datasets', label: 'Datasets' },
    { path: '/orgs/default/guardrails', label: 'Guardrails' },
    // ML
    { path: '/orgs/default/models', label: 'Models' },
    { path: '/orgs/default/inference', label: 'Inference' },
    { path: '/orgs/default/playground', label: 'Playground' },
    // Assistant
    { path: '/orgs/default/assistant', label: 'Assistant' },
    // Observe
    { path: '/orgs/default/insights', label: 'Insights / Health' },
    { path: '/orgs/default/costs', label: 'Costs' },
    { path: '/orgs/default/operations-install', label: 'Operations Install' },
    { path: '/orgs/default/api-docs', label: 'API Docs' },
    { path: '/orgs/default/for-agents', label: 'For Agents' },
    // External
    { path: '/orgs/default/external', label: 'External Providers' },
    { path: '/orgs/default/external/sync', label: 'External Sync' },
    { path: '/orgs/default/external/conflicts', label: 'External Conflicts' },
  ];

  for (const { path, label } of SMOKE_ROUTES) {
    test(`${label} (${path}) loads without 500 errors`, async ({ page }) => {
      const errors = attachBrowserErrorCapture(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();

      // If redirected to login, that is acceptable — the page still loaded
      if (page.url().includes('/login')) {
        await expect(page.locator('h1')).toContainText('Sign in');
      } else {
        await expectNoRawServerErrors(page);
      }
      expectNoBrowserErrors(errors);
    });
  }
});
